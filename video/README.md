# Alvique DU cat tree: TikTok UGC ad pipeline

Local-only: FFmpeg, Python (Pillow, NumPy) and Whisper (faster-whisper). It uses no paid APIs and no AI video generation.

```
pip install -r video/requirements.txt     # plus ffmpeg on PATH
python video/build.py                     # -> out/alvique_tiktok_ad.mp4
```

The first run downloads the Whisper `medium` model (about 1.5 GB) from huggingface.co. After that it runs offline.

## Steps

| Step | Script | Output |
|---|---|---|
| 1. Transcribe (word timestamps, Malay) | `transcribe.py` | `build/words_raw.json` |
| 1b. *or* force-align the known script `video/script.txt` (pocketsphinx, no Whisper needed) | `align.py` | `build/words_raw.json` |
| 2. Clean VO: high-pass, light denoise, drop false starts, shrink pauses > 0.3 s, −14 LUFS. Pitch and speed are never changed. | `clean_audio.py` | `build/vo_clean.wav`, `build/words.json`, `build/audio_edits.json` |
| 3. Map phrases to 5 beats, cut into ≤ 2 s shots on word boundaries | `plan.py` | `build/plan.json`, `build/timeline.md` |
| 4. Render 1080×1920 @ 30 fps, mix SFX (+ optional music) | `render.py` | `out/alvique_tiktok_ad.mp4`, `build/contact_sheet.jpg` |

## Overrides

- **Beat mapping:** `video/beats.json` holds the first words of beats 2–5, e.g.
  `{"starts": ["sejak ada", "kucing aku", "tiang sisal", "rm77"]}`.
  Without it, phrases are mapped by keyword score, in story order.
- **Audio edits:** `video/edits.json` holds `{"drop_words": [i], "keep_words": [i]}`, where each `i` is an index into `build/words_raw.json`.
  Check `build/audio_edits.json` to see what was cut automatically.
- **Music:** put a royalty-free track in `assets/music/`. It is normalised to −20 LUFS and side-chain ducked under the VO. With no file, the ad uses VO and SFX only.
- **Crops, headlines, keywords, CTA layout:** `video/config.py`.

## Notes

- Product photos are cropped to the 1170×1170 product square, which removes the Shopee UI. Each shot then crops inside that square, clear of the old banners and text.
- `p05_playground` and `p06_paradise` are not used. Their right-hand side shows a different cat-tree model.
- Whoosh and pop SFX are synthesised in `render.py`, so there are no third-party audio files.
