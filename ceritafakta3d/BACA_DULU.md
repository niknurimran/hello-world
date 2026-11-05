# Starter Kit: Cerita Fakta 3D (untuk Claude Code)

## Isi kit
| Fail | Fungsi |
|---|---|
| `CLAUDE.md` | Arahan tetap projek: gaya visual, rentak scene, caption, workflow. Claude Code baca fail ni secara automatik setiap kali |
| `PROMPT_PERTAMA.md` | Prompt untuk paste kali pertama, dan prompt untuk video seterusnya |
| `scenes/V01_sotong_kurita.md` | Senarai 32 scene untuk Video 1, ikut ayat VO kau |
| `scenes/_TEMPLATE.md` | Template senarai scene untuk video baru |
| `public/audio/v01_sotong_kurita.wav` | Audio TTS kau untuk V1 |
| `data/v01_captions.json` | Timing setiap ayat (sandaran kalau transkripsi gagal) |
| `reference/gaya_overlay_sample.jpg` | Contoh label, tag dan caption |

## Langkah setup (sekali sahaja)
1. **Pasang Node.js** versi 18 ke atas (nodejs.org, pilih LTS). Semak dengan `node -v` dalam Terminal.
2. **Extract zip ni** ke satu folder, contohnya `Documents/ceritafakta3d`.
3. **Buka Terminal dalam folder tu**, kemudian taip `claude` untuk mula Claude Code.
4. **Paste prompt** dari `PROMPT_PERTAMA.md`.
5. Tunggu. Claude Code akan install library, transkrip audio, bina komponen, tunjuk stills, kemudian render.
   Kali pertama paling lama, sebab dia bina semua komponen. Video seterusnya lebih cepat.

## Tips
- Kalau stills nampak kosong atau kurang menarik, beritahu dia terus, contohnya: "scene 12 terlalu kosong,
  tambah ikan dan cahaya dari atas" atau "sotong nampak macam plastik, buat lebih matte dan comel".
- Kalau render gagal sebab GPU, minta dia cuba `--gl=swangle` (lebih perlahan, tapi pasti jalan).
- **Lesen Remotion:** percuma untuk individu dan syarikat kecil (sehingga 3 orang). Kau guna sebagai
  individu, jadi tak perlu bayar. Semak remotion.dev/license kalau nanti buat dalam syarikat.
- Untuk video seterusnya, hantar skrip/audio kat aku dan aku boleh sediakan senarai scene (`scenes/VXX.md`).
  Atau minta Claude Code buat sendiri berdasarkan template.
