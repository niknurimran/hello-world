# Goldmap EA faceless videos: rough-cut pipeline

This folder renders the three rough-cut videos from `faceless-video-storyboard.md`:

| File | Video | Length |
|---|---|---|
| `goldmap-ea-v1-one-repeating-cycle.mp4` | 1. One Repeating Cycle, No Fortune Telling | 58s |
| `goldmap-ea-v2-count-both-sides.mp4` | 2. Count Both Sides | 52s |
| `goldmap-ea-v3-zero-profit-screenshots.mp4` | 3. Zero Profit Screenshots. On Purpose. | 45s |

All three are 1080×1920, 30 fps, H.264 + AAC. Each has a matching `.srt` subtitle file.

The current cuts use only animated graphics, an AI voiceover (Kokoro TTS, voice `af_heart`) and a simple synthesized music bed. The website and Telegram screens are redrawn graphics, not real recordings.

## Files

| File | What it does |
|---|---|
| `scenes.js` | Scene data (on-screen text, voiceover, timing hints) and the animated SVG art for every scene. Edit this to change content. |
| `export-vo.js` | Writes `vo.json` from `scenes.js`. |
| `audio.py` | Generates the voiceover, timeline (`v1-timeline.json` …), subtitles (`.srt`) and the mixed audio (`v1.wav` …). |
| `render.html` | The 1080×1920 frame that draws one moment of a video. |
| `capture.js` | Steps through the timeline, screenshots each frame in Chrome and pipes the frames plus audio into ffmpeg. |

## Requirements

- Node.js 18+
- Python 3.10+
- ffmpeg on your PATH
- Google Chrome installed (or set `CHROME_PATH` to a Chrome/Chromium executable)

## Rebuild the videos

```bash
cd video
npm install
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# TTS model files (~350 MB), saved to video/models/
mkdir models
curl -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

npm run export-vo                 # scenes.js -> vo.json
python audio.py . models          # voiceover, timelines, subtitles, audio mix
node capture.js v1                # renders goldmap-ea-v1-...mp4 (repeat for v2, v3)
```

Preview single frames without rendering a whole video:

```bash
node capture.js v1 --preview 1.5,5.5,18
```

This writes `prev-v1-<seconds>.png` files.

## Notes

- Scene length is the longer of the scene's `min` value and its voiceover length, plus `hold` on the final scene.
- To change the voice, edit `VOICE` and `speed` in `audio.py`.
- Keep the content rules from the storyboard: no faces, no profit or income figures, and the risk line on every end card.
