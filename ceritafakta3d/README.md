# Cerita Fakta 3D — projek Remotion

Video menegak 1080×1920 (30 fps) untuk @ceritafakta3d. Arahan gaya penuh ada dalam `CLAUDE.md`.

## Arahan biasa
| Arahan | Fungsi |
|---|---|
| `npm install` | Pasang semua library (sekali) |
| `npm run dev` | Buka Remotion Studio untuk tengok & scrub video |
| `npm run transcribe:v01` | Transkrip audio dengan whisper.cpp (muat turun model ~1.5 GB) → `data/v01_words.json` |
| `npm run words:v01` | Sandaran tanpa whisper: guna `data/v01_segments.json` → `data/v01_words.json` |
| `npm run stills:v01` | Render 10 still untuk semakan → `out/stills/` |
| `npm run render:v01` | Render penuh → `out/V01_sotong_kurita.mp4` |

Kalau render gagal sebab GPU: tambah `--gl=swangle` (atau `GL=swangle` untuk stills).

## Struktur
```
src/
  components/  Chip, Caption, Tag, Panel (ECG, bar, counter, bateri, teaser), Flash, Watermark, VideoEngine
  envs/        Env.tsx: studio, seabed, deep, lab, darklab, water, night, neon, macro, split (+ lampu, kabus, hiasan)
  objects/     Octopus (x-ray, lengan prosedural, glow), AbangBlok (poses), Heart, Props (beaker, titisan, molekul,
               jubin jadual berkala, UFO, insang, sel darah, neuron, pai, ketam, balang, bulu, butang Follow ...)
  lib/         timing.ts, camera.ts (pose kamera + unjuran 3D→skrin), easing.ts, theme.ts, texture.ts
  videos/      V01_SotongKurita.tsx — senarai 32 scene (data sahaja)
```
Video baru = fail baru dalam `src/videos/` dengan senarai scene + daftar dalam `src/Root.tsx`.
Setiap scene: `chip`, `anchor` ([baris caption, indeks perkataan] untuk potong tepat pada perkataan),
`env`, `cam` (dolly/orbit), `world` (objek 3D), `tags`, `overlay` (panel).

## Nota timing V01
Whisper tak dapat dijalankan dalam persekitaran build (model tak boleh dimuat turun), jadi timing perkataan
dibina daripada pengesanan senyap (ffmpeg `silencedetect`) dalam audio sebenar — 35 frasa dipadankan dengan
teks skrip — dan perkataan dalam setiap frasa diagih ikut panjang huruf. Untuk timing lebih tepat,
jalankan `npm run transcribe:v01` di PC kau kemudian render semula.
