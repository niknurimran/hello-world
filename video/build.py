"""One command: transcribe -> clean VO -> plan shots -> render.

  python video/build.py                 # full pipeline
  python video/build.py --model large-v3
  python video/build.py --skip-transcribe   # reuse build/words_raw.json
"""
import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def step(*args):
    print(f"\n== {' '.join(args)}", flush=True)
    subprocess.run([sys.executable, *args], cwd=HERE, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="medium")
    ap.add_argument("--skip-transcribe", action="store_true")
    a = ap.parse_args()
    if not (a.skip_transcribe and (HERE.parent / "build" / "words_raw.json").exists()):
        step("transcribe.py", "--model", a.model)
    step("clean_audio.py")
    step("plan.py")
    step("render.py", "--stills")
    step("render.py")


if __name__ == "__main__":
    main()
