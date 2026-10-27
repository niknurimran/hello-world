"""Step 1 (alternative): forced-align a known script to the VO.

Use this instead of transcribe.py when Whisper is unavailable but the VO
text is known (video/script.txt). Pocketsphinx's bundled English acoustic
model is driven with Malay pronunciations (PRON below, letter rules as a
fallback), which is enough to find word boundaries in a known sentence.
Writes build/words_raw.json in the same format as transcribe.py.
"""
import argparse
import re
import tempfile
from pathlib import Path

import numpy as np

from common import ASSETS, BUILD, ROOT, read_audio, save_json

PRON = {
    "sofa": ["S OW F AA", "S OW F AH"],
    "baru": ["B AA R UW"], "beli": ["B AH L IY"], "bulan": ["B UW L AA N"],
    "lepas": ["L AH P AA S"], "dah": ["D AA"], "kena": ["K AH N AA"],
    "cakar": ["CH AA K AA R", "CH AA K AA"], "lagi": ["L AA G IY"],
    "sejak": ["S AH JH AA K", "S AH JH AA"], "ada": ["AA D AA"],
    "cat": ["K AE T"], "tree": ["T R IY"], "ni": ["N IY"], "aku": ["AA K UW"],
    "terus": ["T AH R UW S", "T R UW S"], "selamat": ["S AH L AA M AA T"],
    "kucing": ["K UW CH IY NG"], "pun": ["P UW N"], "tak": ["T AA K", "T AA"],
    "nak": ["N AA K", "N AA"], "turun": ["T UW R UW N"],
    "tiang": ["T IY AA NG", "T IY Y AA NG"], "sisal": ["S IY S AA L", "S AY S AH L"],
    "kusyen": ["K UW SH AH N", "K UH SH AH N"], "boleh": ["B OW L EH", "B OW L EY"],
    "basuh": ["B AA S UW"], "tapak": ["T AA P AA K", "T AA P AA"],
    "lebar": ["L AH B AA R", "L EH B AA R"], "memang": ["M AH M AA NG"],
    "kukuh": ["K UW K UW"],
    "rm77": ["AA R EH M S EH V AH N T IY S EH V AH N",
             "AA R EH M T UW JH UW P UW L UW T UW JH UW",
             "T UW JH UW P UW L UW T UW JH UW R IH NG G IH T"],
    "je": ["JH AH", "JH EH"], "tekan": ["T AH K AA N"], "beg": ["B EH G"],
    "kuning": ["K UW N IY NG"], "sekarang": ["S AH K AA R AA NG", "S K AA R AA NG"],
    "sebelum": ["S AH B AH L UW M"], "habis": ["HH AA B IY S", "AA B IY S"],
    "stok": ["S T OW K", "S T AO K"],
}

LETTERS = [("ng", "NG"), ("ny", "N Y"), ("sy", "SH"), ("kh", "K"), ("ai", "AY"),
           ("au", "AW"), ("a", "AA"), ("e", "AH"), ("i", "IY"), ("o", "OW"),
           ("u", "UW"), ("b", "B"), ("c", "CH"), ("d", "D"), ("f", "F"), ("g", "G"),
           ("h", "HH"), ("j", "JH"), ("k", "K"), ("l", "L"), ("m", "M"), ("n", "N"),
           ("p", "P"), ("q", "K"), ("r", "R"), ("s", "S"), ("t", "T"), ("v", "V"),
           ("w", "W"), ("x", "K S"), ("y", "Y"), ("z", "Z")]


def g2p(word):
    out, i = [], 0
    while i < len(word):
        for k, v in LETTERS:
            if word.startswith(k, i):
                out.append(v)
                i += len(k)
                break
        else:
            i += 1
    return " ".join(out)


def key(token):
    return re.sub(r"[^a-z0-9]", "", token.lower())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo", default=ASSETS / "vo" / "vo.m4a")
    ap.add_argument("--script", default=ROOT / "video" / "script.txt")
    a = ap.parse_args()
    from pocketsphinx import Decoder, get_model_path

    tokens = Path(a.script).read_text().split()
    keys = [key(t) for t in tokens]
    with tempfile.NamedTemporaryFile("w", suffix=".dict", delete=False) as d:
        for k in sorted(set(keys)):
            for n, p in enumerate(PRON.get(k) or [g2p(k)]):
                d.write(f"{k if n == 0 else f'{k}({n + 1})'} {p}\n")
        dict_path = d.name

    pcm = (np.clip(read_audio(a.vo, 16000), -1, 1) * 32767).astype(np.int16).tobytes()
    dec = Decoder(hmm=str(Path(get_model_path()) / "en-us" / "en-us"), dict=dict_path,
                  samprate=16000, loglevel="FATAL")
    dec.set_align_text(" ".join(keys))
    dec.start_utt()
    dec.process_raw(pcm, full_utt=True)
    dec.end_utt()
    segs = [s for s in dec.seg() if s.word not in ("<s>", "</s>", "<sil>", "[NOISE]")]
    if len(segs) != len(tokens):
        raise SystemExit(f"alignment failed: {len(segs)} of {len(tokens)} words")
    fps = 100
    words = [dict(w=t, start=round(s.start_frame / fps, 3),
                  end=round((s.end_frame + 1) / fps, 3), p=None)
             for t, s in zip(tokens, segs)]
    save_json(BUILD / "words_raw.json", dict(engine="pocketsphinx-align", words=words,
                                             segments=[]))
    for w in words:
        print(f"{w['start']:6.2f} {w['end']:6.2f}  {w['w']}")


if __name__ == "__main__":
    main()
