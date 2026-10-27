import json
import re
import subprocess
from pathlib import Path

import numpy as np

from config import SR

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
BUILD = ROOT / "build"
OUT = ROOT / "out"
FONT_ANTON = ASSETS / "fonts" / "Anton-Regular.ttf"


def ffmpeg(*args, capture=False):
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-y", *map(str, args)]
    if capture:
        return subprocess.run(cmd, check=True, capture_output=True, text=True)
    return subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL)


def read_audio(path, sr=SR):
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error", "-i", str(path),
         "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def write_audio(path, x, sr=SR):
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
         "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
         "-c:a", "pcm_s24le", str(path)],
        input=np.asarray(x, dtype=np.float32).tobytes(), check=True)


def loudnorm(src, dst, lufs, tp=-1.5, lra=11, pre=""):
    """Two-pass EBU R128 loudnorm (linear) so dynamics are untouched."""
    chain = (pre + "," if pre else "")
    first = ffmpeg("-i", src, "-af",
                   f"{chain}loudnorm=I={lufs}:TP={tp}:LRA={lra}:print_format=json",
                   "-f", "null", "-", capture=True).stderr
    m = json.loads(first[first.rindex("{"):first.rindex("}") + 1])
    ffmpeg("-i", src, "-af",
           f"{chain}loudnorm=I={lufs}:TP={tp}:LRA={lra}"
           f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
           f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
           f":offset={m['target_offset']}:linear=true",
           "-ar", str(SR), "-c:a", "pcm_s24le", dst)
    # Linear mode backs off when the true-peak ceiling would be hit; make up
    # the difference with plain gain into a transparent peak limiter.
    for _ in range(4):
        got, _ = measure_lufs(dst)
        if abs(got - lufs) <= 0.3:
            break
        tmp = Path(dst).with_suffix(".pre.wav")
        Path(dst).rename(tmp)
        ceiling = 10 ** ((tp - 0.3) / 20)
        ffmpeg("-i", tmp, "-af",
               f"volume={lufs - got:.2f}dB,alimiter=limit={ceiling:.3f}:attack=2:"
               f"release=60:level=false,aresample={SR * 4},aresample={SR}",
               "-c:a", "pcm_s24le", dst)
        tmp.unlink()


def measure_lufs(path):
    err = ffmpeg("-i", path, "-af", "ebur128=peak=true", "-f", "null", "-",
                 capture=True).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]
    tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)
    return float(i), float(tp[-1]) if tp else None


def norm(word):
    return re.sub(r"[^\w.\-]", "", word.lower()).strip(".-")


def load_json(path):
    return json.loads(Path(path).read_text())


def save_json(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False))
