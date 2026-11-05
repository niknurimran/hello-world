# Cerita Fakta 3D — Project Instructions for Claude Code

You are building short vertical 3D-animated fact videos for the social media account
**Cerita Fakta 3D (@ceritafakta3d)** — TikTok, Instagram Reels, Facebook Reels.
Narration is in casual Malay (Bahasa Melayu). The owner (Nik) records/creates the voiceover
with TTS; you build and render the animation that matches it.

## Tech stack (use exactly this unless told otherwise)
- **Remotion** (React video framework) + **@remotion/three** + **@react-three/fiber** + **@react-three/drei**
- TypeScript
- Word-level timestamps: **@remotion/install-whisper-cpp** (model `medium` or `large-v3`, language `ms`).
  If transcription quality is poor, fall back to `data/<video>_captions.json` (line-level timings) and
  distribute words inside each line by character length.
- Render: `npx remotion render <CompId> out/<name>.mp4 --gl=angle` (or `--gl=vulkan` / `--gl=egl` if faster on this PC).
- Output: **1080×1920, 30 fps, H.264, audio AAC**.

## Visual style (must match every video — this is the brand)
Reference: a popular Malaysian "3D explainer" style. Clean, toy-like, low-poly, bright.
- **World:** soft light-grey studio (#C9CCD3 → #A9AEB8 gradient sky), floor fades into fog at horizon.
  Scenes may swap to themed environments (seabed, road, kitchen, lab, space) but keep the same soft, matte, toy look.
- **Objects:** built from simple primitives (boxes, spheres, cylinders, capsules, tori) with **slightly rounded edges**
  (`RoundedBox`), matte `meshStandardMaterial` (roughness ~0.6), saturated but not neon colours.
  Free CC0 low-poly GLTF models (e.g. Poly Pizza, Kenney) are allowed if they match the look — keep a `CREDITS.md`.
- **Lighting:** hemisphere light + one directional key light with **soft shadows** + `ContactShadows` under objects,
  optional `Environment preset="city"` at low intensity. No harsh black shadows.
- **Mascot "Abang Blok":** blocky Minecraft-like human (box head, box body, box limbs), teal shirt, navy pants,
  warm skin tone, black hair block, simple eyes + mouth. Appears in many videos as the narrator/reactor
  (pointing, shocked, laughing, waving). Build once as a reusable component with poses.
- **Never** draw copyrighted characters, real brand logos or platform logos.

### Overlay UI (HTML/React layer above the 3D canvas)
1. **Top chip** (y ≈ 250px): black pill `#16181D`, coloured dot, white monospace bold, letter-spacing 6px, ~34px.
   Text = the scene label in UPPERCASE Malay (e.g. `DUA JANTUNG KECIL`). Slides/fades in at each scene start.
2. **Tags** attached to 3D objects (project 3D position → screen): rounded label, bold 44px, slight rotation (±3–6°),
   pop-in with back-ease. Colours: green `#3DDC84` = positive/name, yellow `#FFD23F` = info, red `#EF4444` = danger,
   blue `#4CC9F0` = water/cold/oxygen, black = neutral. Clamp inside the frame (30px margin).
3. **Caption** (y ≈ 1330px): white rounded box, max-width 900px, bold 54px, centered, wraps to 2 lines.
   Words already spoken = dark `#14161A`, upcoming = grey `#B7BAC2`, current word underlined orange `#FF5A36`.
   Caption shows one spoken line at a time, synced to word timestamps.
4. **Panels** when useful: dark rounded panel with ECG line, progress bar, counters, pie chart, before/after.
5. **Watermark**: `@CERITAFAKTA3D` small monospace, 45% opacity, bottom ~150px from edge.
6. Keep the bottom 300px and right 140px free of important content (platform UI covers them).

## Pacing rules (most important — this is why the reference looks "rich")
- **A new scene every 1.5–3 seconds.** A 60-second video should have **25–35 scenes**.
- Every scene must change at least two of: environment, main object, camera angle, colour, overlay panel.
- Never reuse the same shot twice in a row. Recaps at the end may reuse objects but with new camera angles.
- Camera is always moving a little (slow dolly / orbit / push-in). Cuts on the spoken phrase boundaries.
- Objects enter with motion (pop, drop & bounce, slide, grow) — nothing just appears static.
- Short white flash (3 frames, 40% opacity) or quick zoom-whip between scenes.

## Workflow for each video
1. Read `scenes/<video>.md` (scene list with timing, chip text, visuals, tags).
2. Transcribe `public/audio/<video>.*` for word timestamps → save `data/<video>_words.json`.
   Align each scene's start to the first word of its phrase (scene list times are approximate).
3. Build/extend reusable components first (`src/components/`), then the video composition (`src/videos/<Video>.tsx`).
4. **Before the full render:** render 8–10 stills at the busiest moments
   (`npx remotion still <CompId> out/stills/f<frame>.png --frame=<n> --gl=angle`) and check them:
   nothing clipped, tags readable, caption not covering the main object, scenes clearly different.
5. Full render. Report the output path and duration.

## Code organisation
```
src/
  components/   Chip, Caption, Tag, Panel, Flash, AbangBlok, Studio (floor+lights), Seabed, ...
  objects/      Heart, BloodDrop, Octopus, Beaker, Molecule, ... (reusable 3D props)
  videos/       V01_SotongKurita.tsx, V02_Geletek.tsx, ...
  lib/          timing.ts (word timestamps → scenes/captions), easing.ts, project.ts
public/audio/   voiceover files
data/           *_words.json, *_captions.json
scenes/         scene lists (one per video)
```
Make components data-driven so each new video is mostly a new scene list + a few new props.

## Facts
The script text is fact-checked. Do not add new factual claims in tags or panels beyond what the
script says. Numbers on screen must match the voiceover.
