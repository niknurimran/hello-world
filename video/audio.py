"""Generate voiceover, timeline, subtitles and the mixed audio track for each video."""
import json, re, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = sys.argv[1]
MODELS = sys.argv[2]
SR = 24000
VOICE = "af_heart"
VO_OFFSET = 0.2
TAIL = 0.3

SAY = [
    (r"goldmapea\.com", "goldmap E A dot com"),
    (r"Goldmap EA", "Goldmap E A"),
    (r"MT4 and MT5", "M T four and M T five"),
    (r"\bVPS\b", "V P S"),
    (r"1\.5 percent", "one point five percent"),
    (r"\b24\b", "twenty-four"),
    (r"MetaTrader", "Meta Trader"),
]

def say(text):
    for a, b in SAY:
        text = re.sub(a, b, text)
    return text.replace("’", "'")

def chunks(text, max_words=6):
    words = text.split()
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words or re.search(r"[.?!:,]$", w) and len(cur) >= 3:
            out.append(" ".join(cur)); cur = []
    if cur:
        if out and len(cur) <= 2:
            out[-1] += " " + " ".join(cur)
        else:
            out.append(" ".join(cur))
    return out

def env_ad(n, a, d):
    e = np.ones(n)
    a, d = min(n, int(a * SR)), min(n, int(d * SR))
    if a: e[:a] = np.linspace(0, 1, a)
    if d: e[-d:] *= np.linspace(1, 0, d)
    return e

def add(buf, sig, t):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]

def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode="same")

rng = np.random.default_rng(7)

def whoosh():
    n = int(.45 * SR)
    noise = lowpass(rng.standard_normal(n), 12)
    e = np.concatenate([np.linspace(0, 1, int(.2 * SR)) ** 2, np.linspace(1, 0, n - int(.2 * SR)) ** 1.5])
    return noise * e * .09

def hit(f=52, dur=.9, vol=.55):
    n = int(dur * SR); tt = np.arange(n) / SR
    freq = f * (1 + 1.5 * np.exp(-tt * 18))
    s = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 4.5)
    click = rng.standard_normal(n) * np.exp(-tt * 120) * .4
    return (s + click) * vol

def tap():
    n = int(.12 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1400 * tt) * np.exp(-tt * 60) * .5 + rng.standard_normal(n) * np.exp(-tt * 300) * .3) * .35

def music(total):
    n = int(total * SR); tt = np.arange(n) / SR
    out = np.zeros(n)
    bpm = 96; beat = 60 / bpm; bar = beat * 4
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [130.81, 196.0, 261.63], [196.0, 246.94, 293.66]]
    t0, i = 0.0, 0
    while t0 < total:
        notes = chords[i % 4]
        seg = int(min(bar + 1.0, total - t0) * SR)
        st = np.arange(seg) / SR
        e = env_ad(seg, .6, min(1.0, seg / SR * .5))
        s = sum(np.sin(2 * np.pi * f * st) * .5 + np.sin(2 * np.pi * f * 2.003 * st) * .12 for f in notes)
        s += np.sin(2 * np.pi * notes[0] / 2 * st) * .5
        add(out, lowpass(s * e, 6) * .05, t0)
        t0 += bar; i += 1
    kt = 0.0
    kn = int(.28 * SR); ktt = np.arange(kn) / SR
    kick = np.sin(2 * np.pi * np.cumsum(48 * (1 + 1.2 * np.exp(-ktt * 30))) / SR) * np.exp(-ktt * 14) * .16
    while kt < total:
        add(out, kick, kt); kt += beat
    fade = min(1.5, total / 4)
    out *= env_ad(n, .8, fade)
    return out

def main():
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    videos = json.load(open(f"{HERE}/vo.json", encoding="utf-8"))
    for v in videos:
        t, scenes, vo_clips = 0.0, [], []
        for s in v["scenes"]:
            audio, sr = k.create(say(s["vo"]), voice=VOICE, speed=1.1, lang="en-us")
            assert sr == SR
            audio = np.asarray(audio, dtype=np.float64)
            vdur = len(audio) / SR
            dur = max(s["min"], VO_OFFSET + vdur + TAIL) + s["hold"]
            parts = chunks(s["vo"])
            weights = np.array([len(c) + 4 for c in parts], dtype=float)
            bounds = np.concatenate([[0], np.cumsum(weights) / weights.sum()]) * vdur
            subs = [{"t0": round(t + VO_OFFSET + bounds[i], 3), "t1": round(t + VO_OFFSET + bounds[i + 1], 3), "text": c} for i, c in enumerate(parts)]
            scenes.append({"start": round(t, 3), "dur": round(dur, 3), "voDur": round(vdur, 3), "subs": subs, "sfx": s["sfx"], "slamWords": s["slamWords"]})
            vo_clips.append((t + VO_OFFSET, audio))
            t += dur
        total = t
        n = int(total * SR) + SR // 2
        vo = np.zeros(n)
        for st, a in vo_clips: add(vo, a / (np.max(np.abs(a)) + 1e-9) * .85, st)
        bed = music(n / SR)
        active = lowpass((np.abs(vo) > .02).astype(float), int(.3 * SR))
        bed *= 1 - .55 * np.clip(active * 3, 0, 1)
        fx = np.zeros(n)
        for i, sc in enumerate(scenes):
            if i: add(fx, whoosh(), sc["start"] - .2)
            if sc["sfx"] == "hit": add(fx, hit(), sc["start"])
            if sc["sfx"] == "slam":
                for w in range(sc["slamWords"]): add(fx, hit(60, .45, .35), sc["start"] + .22 * w)
            if sc["sfx"] == "tap": add(fx, tap(), sc["start"] + 1.6)
        mix = vo + bed + fx
        mix = np.tanh(mix * 1.1) / np.tanh(1.1)
        mix = mix / max(1e-9, np.max(np.abs(mix))) * .95
        sf.write(f"{HERE}/{v['id']}.wav", mix.astype(np.float32), SR)
        sf.write(f"{HERE}/{v['id']}-vo-only.wav", (vo / max(1e-9, np.max(np.abs(vo))) * .95).astype(np.float32), SR)
        json.dump({"total": round(total, 3), "scenes": scenes}, open(f"{HERE}/{v['id']}-timeline.json", "w", encoding="utf-8"), indent=1)
        def ts(x):
            ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s_, ms = divmod(ms, 1000)
            return f"{h:02}:{m:02}:{s_:02},{ms:03}"
        lines, idx = [], 1
        for sc in scenes:
            for sb in sc["subs"]:
                lines += [str(idx), f"{ts(sb['t0'])} --> {ts(sb['t1'])}", sb["text"], ""]; idx += 1
        open(f"{HERE}/{v['file']}.srt", "w", encoding="utf-8").write("\n".join(lines))
        print(v["id"], "total", round(total, 2), "s", [round(s["dur"], 2) for s in scenes])

main()
