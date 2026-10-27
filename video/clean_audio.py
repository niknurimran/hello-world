"""Step 2: clean the VO without changing pitch or speed.

  - high-pass + light FFT noise reduction (afftdn)
  - remove false starts (repeated words / restarted phrases)
  - shrink every pause longer than GAP_KEEP_MAX (breaths, dead air);
    shorter natural pauses are left as recorded
  - two-pass loudnorm to -14 LUFS

Writes build/vo_clean.wav, build/words.json (timestamps on the trimmed
timeline) and build/audio_edits.json (what was cut, for review).
Manual overrides: video/edits.json {"drop_words": [i...], "keep_words": [i...]}
with indices into build/words_raw.json.
"""
import argparse

import numpy as np

from common import ASSETS, BUILD, ROOT, load_json, loudnorm, measure_lufs, norm, \
    read_audio, save_json, write_audio, ffmpeg
from config import GAP_KEEP_MAX, LEAD_PAD, SR, TAIL_PAD, VO_LUFS, XFADE

FRAME = 0.01


def rms_db(x):
    n = int(FRAME * SR)
    frames = x[: len(x) // n * n].reshape(-1, n)
    return 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)


def refine(words, env, thresh, dur):
    """Whisper word edges drift ~50-150 ms; snap them to the energy envelope."""
    loud = lambda t: env[min(int(t / FRAME), len(env) - 1)] > thresh
    for i, w in enumerate(words):
        nxt = words[i + 1]["start"] if i + 1 < len(words) else dur
        prv = words[i - 1]["end"] if i else 0.0
        e, s = w["end"], w["start"]
        while e < min(w["end"] + 0.15, nxt - 0.02) and loud(e):
            e += FRAME
        while s > max(w["start"] - 0.10, prv + 0.02) and loud(s - FRAME):
            s -= FRAME
        w["start"], w["end"] = round(s, 3), round(max(e, s + 0.05), 3)
    return words


def false_starts(words):
    n = [norm(w["w"]) for w in words]
    drop, why = set(), {}
    for i, t in enumerate(n):
        if t.endswith("-") or words[i]["w"].endswith("-"):
            drop.add(i); why[i] = "fragment"
    for k in (4, 3, 2, 1):
        for i in range(len(n) - 2 * k + 1):
            if any(j in drop for j in range(i, i + 2 * k)):
                continue
            a, b = n[i:i + k], n[i + k:i + 2 * k]
            gap = words[i + k]["start"] - words[i + k - 1]["end"]
            same = a == b and (k > 1 or (len(a[0]) >= 3 and gap > 0.25))
            # "sofa ba... sofa baru": last word of the first take cut short
            restart = (k > 1 and a[:-1] == b[:-1] and a[-1] != b[-1]
                       and b[-1].startswith(a[-1]) and gap > 0.15)
            if same or restart:
                for j in range(i, i + k):
                    drop.add(j); why[j] = f"repeat x{k}"
    return drop, why


def energy_units(env, thresh, dur):
    """Fallback when there is no transcript: speech runs from the envelope."""
    on = env > thresh
    units, start = [], None
    for f, v in enumerate(on):
        t = f * FRAME
        if v and start is None:
            start = t
        if not v and start is not None:
            if t - start > 0.06:
                units.append(dict(w="~", start=start, end=t))
            start = None
    if start is not None:
        units.append(dict(w="~", start=start, end=dur))
    return units


def plan_cuts(words, keep, dur):
    kept = sorted(keep)
    spans = []
    start = max(0.0, words[kept[0]]["start"] - 0.06)
    for a, b in zip(kept, kept[1:] + [None]):
        w = words[a]
        if b is None:
            spans.append([start, min(dur, w["end"] + 0.25)])
            break
        nb = words[b]
        if b == a + 1 and nb["start"] - w["end"] <= GAP_KEEP_MAX:
            continue
        nxt_any = words[a + 1]["start"]
        spans.append([start, w["end"] + max(0.0, min(TAIL_PAD, 0.5 * (nxt_any - w["end"])))])
        prv_any = words[b - 1]["end"]
        start = nb["start"] - max(0.0, min(LEAD_PAD, 0.5 * (nb["start"] - prv_any)))
    return spans


def splice(x, spans):
    xf = int(XFADE * SR)
    out, mapping, pos = np.zeros(0, np.float32), [], 0.0
    fade_in = np.sqrt(np.linspace(0, 1, xf, dtype=np.float32))
    fade_out = fade_in[::-1]
    for k, (s, e) in enumerate(spans):
        seg = x[int(s * SR):int(e * SR)].copy()
        if k and len(out) >= xf and len(seg) >= xf:
            out[-xf:] = out[-xf:] * fade_out + seg[:xf] * fade_in
            seg = seg[xf:]
            dst = len(out) / SR - XFADE
        else:
            dst = len(out) / SR
        mapping.append((s, e, dst))
        out = np.concatenate([out, seg])
    return out, mapping


def remap(t, mapping):
    for s, e, d in mapping:
        if t <= e + 1e-6:
            return round(d + max(0.0, t - s), 3)
    s, e, d = mapping[-1]
    return round(d + e - s, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo", default=ASSETS / "vo" / "vo.m4a")
    ap.add_argument("--no-words", action="store_true",
                    help="energy-only trim (no transcript); for testing")
    a = ap.parse_args()
    BUILD.mkdir(exist_ok=True)

    dn = BUILD / "vo_denoised.wav"
    ffmpeg("-i", a.vo, "-af", "highpass=f=70,afftdn=nr=10:nf=-45:tn=1",
           "-ac", "1", "-ar", SR, "-c:a", "pcm_s24le", dn)
    x = read_audio(dn)
    dur = len(x) / SR
    env = rms_db(x)
    floor = np.percentile(env, 10)
    thresh = max(floor + 12, env.max() - 45)

    if a.no_words:
        words = energy_units(env, thresh, dur)
        drop, why = set(), {}
    else:
        words = [dict(w) for w in load_json(BUILD / "words_raw.json")["words"]]
        words = refine(words, env, thresh, dur)
        drop, why = false_starts(words)
        manual = ROOT / "video" / "edits.json"
        if manual.exists():
            m = load_json(manual)
            for i in m.get("drop_words", []):
                drop.add(i); why[i] = "manual"
            for i in m.get("keep_words", []):
                drop.discard(i); why.pop(i, None)
    keep = set(range(len(words))) - drop
    spans = plan_cuts(words, keep, dur)
    y, mapping = splice(x, spans)
    write_audio(BUILD / "vo_trim.wav", y)
    loudnorm(BUILD / "vo_trim.wav", BUILD / "vo_clean.wav", VO_LUFS)

    out_words = []
    for i, w in enumerate(words):
        if i in keep:
            out_words.append(dict(w=w["w"], start=remap(w["start"], mapping),
                                  end=remap(w["end"], mapping), src_i=i))
    removed = []
    for (s0, e0, _), (s1, _, _) in zip(mapping, mapping[1:]):
        removed.append(dict(src_from=round(e0, 3), src_to=round(s1, 3),
                            seconds=round(s1 - e0, 3)))
    lufs, tp = measure_lufs(BUILD / "vo_clean.wav")
    report = dict(source_seconds=round(dur, 3), trimmed_seconds=round(len(y) / SR, 3),
                  lufs=lufs, true_peak=tp, cuts=removed,
                  dropped_words=[dict(i=i, w=words[i]["w"], why=why.get(i))
                                 for i in sorted(drop)])
    save_json(BUILD / "words.json", dict(duration=round(len(y) / SR, 3), words=out_words))
    save_json(BUILD / "audio_edits.json", report)
    print(f"VO {dur:.2f}s -> {len(y) / SR:.2f}s, {len(removed)} gaps shrunk, "
          f"{len(drop)} words dropped, {lufs:.1f} LUFS, TP {tp}")


if __name__ == "__main__":
    main()
