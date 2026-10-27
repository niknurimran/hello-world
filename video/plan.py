"""Step 3: map the VO to the 5 story beats and cut it into shots.

Beat mapping: video/beats.json, if present, lists the opening words of
beats 2-5 ({"starts": ["sejak ada", "kucing aku", "tiang sisal", "rm77"]}).
Otherwise phrases are assigned to beats by keyword score, keeping the
beats in order.

Shots: each beat's VO span is split into cuts of <= MAX_SHOT seconds,
cut only on word boundaries. In the DETAIL beat each spoken feature
keyword anchors its own macro shot + label. The CTA ends on a product +
price frame held for >= END_HOLD seconds.

Writes build/plan.json and build/timeline.md.
"""
import math

from common import BUILD, ROOT, load_json, norm, save_json
from config import BEATS, CTA, END_HOLD, FEATURES, MAX_SHOT, MIN_SHOT

PAUSE_SPLIT = 0.22


def phrases(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        end_punct = w["w"].rstrip()[-1:] in ".?!,;"
        gap = words[i + 1]["start"] - w["end"] if i + 1 < len(words) else 99
        if end_punct or gap > PAUSE_SPLIT:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def kw_hit(token, kws):
    return any(token == k or (len(k) >= 3 and token.startswith(k)) for k in kws)


def score(ph, words, beat):
    return sum(kw_hit(norm(words[i]["w"]), beat["kw"]) for i in ph)


def assign_beats(words, phs):
    """Monotonic DP: phrase -> beat, beats in order, each beat used once."""
    manual = ROOT / "video" / "beats.json"
    if manual.exists():
        starts = load_json(manual)["starts"]
        toks = [norm(w["w"]) for w in words]
        first = [0]
        for s in starts:
            target = [norm(t) for t in s.split()]
            hit = next(i for i in range(first[-1] + 1, len(toks))
                       if toks[i:i + len(target)] == target)
            first.append(hit)
        beat_of = []
        for ph in phs:
            beat_of.append(max(b for b, f in enumerate(first) if ph[0] >= f))
        return beat_of, "beats.json"
    n, k = len(phs), len(BEATS)
    if n < k:
        raise SystemExit(f"only {n} phrases; write video/beats.json by hand")
    neg = -1e9
    best = [[neg] * k for _ in range(n)]
    back = [[0] * k for _ in range(n)]
    for i in range(n):
        for b in range(k):
            s = score(phs[i], words, BEATS[b]) + (3 if (i == 0 and b == 0) else 0)
            if i == 0:
                best[i][b] = s if b == 0 else neg
                continue
            stay, step = best[i - 1][b], best[i - 1][b - 1] if b else neg
            best[i][b], back[i][b] = (stay + s, b) if stay >= step else (step + s, b - 1)
    b, beat_of = k - 1, [0] * n
    for i in range(n - 1, -1, -1):
        beat_of[i] = b
        b = back[i][b]
    return beat_of, "keywords"


def boundaries(words, t0, t1):
    """Legal cut times inside (t0, t1): the middle of each inter-word gap."""
    out = []
    for a, b in zip(words, words[1:]):
        t = (a["end"] + b["start"]) / 2
        if t0 + 1e-3 < t < t1 - 1e-3:
            out.append(t)
    return out


def split_span(t0, t1, cuts, min_n=1):
    """Split [t0, t1] into <= MAX_SHOT pieces using legal cut times."""
    pieces, cur = [], t0
    n_total = max(min_n, math.ceil((t1 - t0) / MAX_SHOT - 1e-6))
    while len(pieces) < n_total - 1 or t1 - cur > MAX_SHOT + 1e-6:
        n_left = max(n_total - len(pieces),
                     math.ceil((t1 - cur) / MAX_SHOT - 1e-6))
        if n_left <= 1:
            n_left = 2
        ideal = cur + (t1 - cur) / n_left
        ok = [c for c in cuts if cur + MIN_SHOT <= c <= cur + MAX_SHOT and t1 - c >= MIN_SHOT]
        if not ok:
            if t1 - cur <= MAX_SHOT + 1e-6:
                break   # cannot add another cut without a too-short shot
            ok = [c for c in cuts if c > cur + MIN_SHOT] or [cur + MAX_SHOT]
            ok = ok[:1]
        c = min(ok, key=lambda c: abs(c - ideal))
        pieces.append((cur, c))
        cur = c
    pieces.append((cur, t1))
    return pieces


def pick(pool, used, prev):
    """Next shot from the pool; reuse with reversed zoom once exhausted."""
    for name in pool:
        if name not in used:
            return name, False
    for name in pool:
        if name != prev:
            return name, True
    return pool[0], True


def main():
    data = load_json(BUILD / "words.json")
    words, vo_dur = data["words"], data["duration"]
    phs = phrases(words)
    beat_of, how = assign_beats(words, phs)

    # beat spans on the trimmed timeline (cut in the gap before a beat)
    starts = {}
    for ph, b in zip(phs, beat_of):
        starts.setdefault(b, ph[0])
    beat_t = []
    for b in range(len(BEATS)):
        if b not in starts:
            raise SystemExit(f"beat {BEATS[b]['name']} has no VO; edit video/beats.json")
        i = starts[b]
        beat_t.append(0.0 if b == 0 else (words[i - 1]["end"] + words[i]["start"]) / 2)
    last_word_end = words[-1]["end"]

    # CTA end frame: starts on a word boundary, lasts END_HOLD..MAX_SHOT
    cta_cuts = [beat_t[-1]] + boundaries(words, beat_t[-1], last_word_end)
    end_start = None
    for c in reversed(cta_cuts):
        if last_word_end + 0.35 - c >= END_HOLD:
            end_start = c
            break
    end_start = end_start if end_start is not None else beat_t[-1]
    total = round(max(vo_dur, end_start + END_HOLD, last_word_end + 0.35), 3)
    if total - end_start > MAX_SHOT:
        later = [c for c in cta_cuts if c > end_start and total - c >= END_HOLD]
        if later:
            end_start = later[0]
    beat_t.append(total)

    shots, used, labels = [], set(), []
    events = {}
    for b, beat in enumerate(BEATS):
        t0, t1 = beat_t[b], beat_t[b + 1]
        bw = [w for w in words if t0 <= w["start"] < t1]
        cuts = boundaries(words, t0, t1)
        anchors = []          # (time, shot, label)
        if beat["name"] == "DETAIL":
            for f in FEATURES:
                for w in bw:
                    if kw_hit(norm(w["w"]), f["kw"]):
                        legal = [c for c in cuts if c <= w["start"]] or [t0]
                        anchors.append((max(legal), f["shot"], f["label"]))
                        break
            anchors.sort()
            dedup = []
            for a in anchors:
                if dedup and a[0] - dedup[-1][0] < MIN_SHOT:
                    continue
                dedup.append(a)
            anchors = dedup
        if beat["name"] == "CTA":
            anchors.append((end_start, beat["end_shot"], None))
        # segments between anchors
        marks = sorted({t0, t1, *[a[0] for a in anchors]})
        anchor_at = {a[0]: a for a in anchors}
        prev = shots[-1]["shot"] if shots else None
        for s0, s1 in zip(marks, marks[1:]):
            if s1 - s0 < 1e-3:
                continue
            a = anchor_at.get(s0)
            min_n = beat.get("min_shots", 1) if len(marks) == 2 else 1
            for j, (p0, p1) in enumerate(split_span(s0, s1, cuts, min_n)):
                if a and j == 0:
                    name, rev = a[1], a[1] in used
                    if a[2]:
                        labels.append(dict(t=round(p0, 3), end=round(s1, 3), text=a[2]))
                else:
                    pool = [p for p in beat["pool"]
                            if p not in {x[1] for x in anchors}]
                    name, rev = pick(pool, used, prev)
                used.add(name)
                shots.append(dict(beat=b + 1, shot=name, reverse=rev,
                                  start=round(p0, 3), end=round(p1, 3)))
                prev = name

        # CTA overlay triggers
        if beat["name"] == "CTA":
            def first_kw(kws, default):
                for w in bw:
                    if kw_hit(norm(w["w"]), kws):
                        return round(w["start"], 3)
                return round(default, 3)
            events["cta_start"] = round(t0, 3)
            events["price"] = min(first_kw(CTA["price_kw"], t0 + 0.35), end_start)
            events["arrow"] = min(first_kw(CTA["arrow_kw"], t0 + 0.9), end_start)
            events["berbaloi"] = min(first_kw(CTA["berbaloi_kw"], end_start), end_start)
            events["end_frame"] = round(end_start, 3)

    scenes = [dict(beat=b["id"], name=b["name"], start=round(beat_t[i], 3),
                   end=round(beat_t[i + 1], 3),
                   text=" ".join(words[j]["w"] for ph, bb in zip(phs, beat_of)
                                 if bb == i for j in ph))
              for i, b in enumerate(BEATS)]
    plan = dict(duration=total, vo_duration=vo_dur, mapping=how, scenes=scenes,
                shots=shots, labels=labels, events=events, words=words)
    save_json(BUILD / "plan.json", plan)

    md = [f"# Timeline ({total:.2f}s, beat mapping from {how})", ""]
    for sc in scenes:
        md.append(f"## {sc['beat']}. {sc['name']}  {sc['start']:.2f}-{sc['end']:.2f}s "
                  f"({sc['end'] - sc['start']:.2f}s)")
        md.append(f"> {sc['text']}")
        for s in shots:
            if s["beat"] == sc["beat"]:
                md.append(f"- {s['start']:.2f}-{s['end']:.2f} ({s['end'] - s['start']:.2f}s) "
                          f"`{s['shot']}`{' (reversed zoom)' if s['reverse'] else ''}")
        md.append("")
    md.append("Labels: " + ", ".join(f"{l['text']} @{l['t']:.2f}" for l in labels))
    md.append("CTA events: " + ", ".join(f"{k} @{v:.2f}" for k, v in events.items()))
    (BUILD / "timeline.md").write_text("\n".join(md) + "\n")
    print("\n".join(md))
    longest = max(s["end"] - s["start"] for s in shots)
    print(f"\n{len(shots)} shots, longest {longest:.2f}s")


if __name__ == "__main__":
    main()
