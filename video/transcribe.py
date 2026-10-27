"""Step 1: local Whisper transcription with word-level timestamps.

Writes build/words_raw.json. Uses faster-whisper if installed, otherwise
openai-whisper. Both run fully offline once the model is cached.
"""
import argparse

from common import ASSETS, BUILD, save_json
from config import WHISPER_PROMPT


def with_faster_whisper(path, model_name, lang):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(path), language=lang, word_timestamps=True, beam_size=5,
        initial_prompt=WHISPER_PROMPT, condition_on_previous_text=False,
        vad_filter=False)
    segs = []
    for s in segments:
        segs.append(dict(start=s.start, end=s.end, text=s.text.strip(),
                         words=[dict(w=w.word.strip(), start=w.start, end=w.end,
                                     p=w.probability) for w in s.words]))
    return segs


def with_openai_whisper(path, model_name, lang):
    import whisper
    model = whisper.load_model(model_name)
    res = model.transcribe(str(path), language=lang, word_timestamps=True,
                           initial_prompt=WHISPER_PROMPT,
                           condition_on_previous_text=False)
    return [dict(start=s["start"], end=s["end"], text=s["text"].strip(),
                 words=[dict(w=w["word"].strip(), start=w["start"], end=w["end"],
                             p=w.get("probability", 1.0)) for w in s["words"]])
            for s in res["segments"]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo", default=ASSETS / "vo" / "vo.m4a")
    ap.add_argument("--model", default="medium")
    ap.add_argument("--lang", default="ms")
    a = ap.parse_args()
    try:
        segs = with_faster_whisper(a.vo, a.model, a.lang)
        engine = "faster-whisper"
    except ImportError:
        segs = with_openai_whisper(a.vo, a.model, a.lang)
        engine = "openai-whisper"
    words = [w for s in segs for w in s["words"] if w["w"]]
    save_json(BUILD / "words_raw.json",
              dict(engine=engine, model=a.model, segments=segs, words=words))
    print(" ".join(w["w"] for w in words))
    print(f"{len(words)} words -> {BUILD / 'words_raw.json'}")


if __name__ == "__main__":
    main()
