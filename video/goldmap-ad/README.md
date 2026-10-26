# Goldmap EA: Story/Reels ad v1 (HyperFrames)

A 36-second vertical ad (1080×1920, 30 fps) built with [HyperFrames](https://hyperframes.heygen.com).
The whole ad is made in code: motion graphics, kinetic type, simulated candlestick charts, and generated music and SFX.
It uses no footage, stock images or downloaded audio.

Output: `../../output/goldmap_ad_v1.mp4`, with its contact sheet at `../../output/contact_sheet_v1.jpg`.

## Edit without touching the logic

Everything you'd normally change lives in **`config.js`**:

| Key | What it controls |
|---|---|
| `bpm`, `slots` | Beat grid and slot timing (in beats; 150 BPM = 0.4 s a beat) |
| `colors`, `fonts` | Palette and typefaces |
| `text.*` | Every on-screen line, including the CTA and the risk disclaimer |
| `chart.seeds` | Seeds of the procedural XAUUSD charts (change one to get a different chart) |
| `audio.*` | Music file, volumes, impact beats, SFX cues |

After you edit `config.js`:

```bash
npm run sync     # writes scene/audio timing into index.html (needed after changing bpm, slots or sfx)
npm run audio    # rebuilds the music + SFX from code, then syncs (needed after changing bpm, slots or audio)
```

## Build

```bash
npm install
npx hyperframes browser ensure        # one-time: headless Chrome for rendering
npm run check                         # lint, runtime, layout, contrast
npx hyperframes preview --background  # Studio preview
npx hyperframes render --quality delivery --fps 30 --output /tmp/raw.mp4
tools/finish.sh /tmp/raw.mp4 ../../output/goldmap_ad_v1.mp4 ../../output/contact_sheet_v1.jpg
```

`tools/finish.sh` normalises loudness to -14 LUFS. It changes the audio only: the video is stream-copied and not re-encoded. It also builds a contact sheet with one frame per second.

## Files

| Path | What it is |
|---|---|
| `index.html` | Root composition (`#stage`, `goldmap`). It holds the scene hosts and audio clips that `npm run sync` writes. |
| `compositions/*.html` | One file per slot: `hook`, `brand`, `problem`, `shift`, `demo`, `how`, `urgency`, `cta`. It also holds the `bg` layer (grid, glow, particles), the `risk` layer (disclaimer) and the `fx` layer (grain, vignette, cut accents). |
| `assets/lib/gm.js` | Shared helpers: seeded PRNG (mulberry32), beat grid, candlestick chart builder, and the slam, shake and glitch moves |
| `assets/fonts`, `assets/vendor` | Bundled Bebas Neue, Anton, Inter (OFL) and GSAP, so nothing loads from a CDN at render time |
| `tools/make-audio.mjs` | Music bed (kick, clap, hats, sub bass, stabs, riser, impacts) and SFX (whoosh, click, pop, glitch) |
| `tools/sync.mjs` | Writes the scene and audio timing from `config.js` into `index.html` |
| `tools/finish.sh` | Loudness normalisation and contact sheet |

## Content rules kept

- Every chart has an "Illustration" label. No profit, balance, equity, P/L, win rate or % return appears anywhere.
- No invented numbers: the slot bar shows no count.
- The risk disclaimer is on screen for the last 6.4 s (from URGENCY to the end).
- The 250 px at the top and 350 px at the bottom are kept free of text, for the Story UI and the "See details" button.
