# Prompt pertama untuk Claude Code

Salin semua teks dalam kotak bawah dan paste dalam Claude Code (dalam folder projek ni).

```
Read CLAUDE.md fully, then scenes/V01_sotong_kurita.md.

Set up this folder as a Remotion + TypeScript project with @remotion/three,
@react-three/fiber, @react-three/drei and @remotion/install-whisper-cpp.
Keep the existing folders (scenes/, data/, public/audio/, reference/).

Then:
1. Install whisper.cpp + a multilingual model and transcribe
   public/audio/v01_sotong_kurita.wav (language "ms") with word-level timestamps.
   Save to data/v01_words.json. If the transcript is poor, use data/v01_captions.json
   and split words by character length.
2. Build the reusable components from CLAUDE.md (Studio, Seabed, Chip, Caption, Tag,
   Panel/ECG, Flash, AbangBlok with poses, Octopus with x-ray mode and arm animations,
   Heart, BloodDrop, Beaker, Molecule, PeriodicTile, UFO).
3. Build composition V01-SotongKurita following ALL 32 scenes in the scene list,
   synced to the word timestamps. One new scene every ~1.5–3 s.
4. Render 10 stills at the busiest frames into out/stills/, look at them yourself,
   fix anything clipped, overlapping or too similar between scenes.
5. Render the full video to out/V01_sotong_kurita.mp4 (1080x1920, 30fps) with --gl=angle.
   If angle fails, try --gl=vulkan then --gl=swangle.

Work step by step, don't ask me questions unless something is blocked.
Show me the stills before the full render.
```

## Untuk video seterusnya (V02, V03, …)

1. Letak audio baru dalam `public/audio/` (contoh `v02_geletek.wav`)
2. Buat senarai scene baru dalam `scenes/` (salin `scenes/_TEMPLATE.md`, atau minta aku/Claude Code buatkan)
3. Paste prompt ni:

```
Read CLAUDE.md, then scenes/V02_geletek.md. Transcribe public/audio/v02_geletek.wav,
build composition V02-Geletek reusing existing components (add new props if needed),
render 10 stills for review, then render out/V02_geletek.mp4.
```
