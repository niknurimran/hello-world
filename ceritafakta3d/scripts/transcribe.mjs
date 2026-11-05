// Word-level timestamps with whisper.cpp (run this on your own PC — it downloads whisper.cpp + a model).
// Writes data/<video>_words.json in the same format as scripts/make-words.mjs, but with real word timings.
// The on-screen words always come from the fact-checked script (data/<video>_captions.json);
// whisper is only used for WHEN each word is spoken (aligned by character position).
// Usage: node scripts/transcribe.mjs v01 public/audio/v01_sotong_kurita.wav [medium|large-v3]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } from '@remotion/install-whisper-cpp';

const [video = 'v01', audio = 'public/audio/v01_sotong_kurita.wav', model = 'medium'] = process.argv.slice(2);
const whisperPath = path.resolve('whisper.cpp');
await installWhisperCpp({ to: whisperPath, version: '1.5.5' });
await downloadWhisperModel({ model, folder: whisperPath });

const wav16 = path.resolve('out', `${video}_16k.wav`);
fs.mkdirSync(path.dirname(wav16), { recursive: true });
execSync(`ffmpeg -y -loglevel error -i "${audio}" -ar 16000 -ac 1 "${wav16}"`);

const whisperCppOutput = await transcribe({ inputPath: wav16, whisperPath, model, tokenLevelTimestamps: true, language: 'ms' });
const { captions: wcap } = toCaptions({ whisperCppOutput });
fs.writeFileSync(path.resolve('data', `${video}_whisper_raw.json`), JSON.stringify(wcap, null, 1));

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
// timeline of whisper characters → time
const chars = [];
for (const c of wcap) {
  const t = norm(c.text);
  for (let i = 0; i < t.length; i++) chars.push(c.startMs / 1000 + ((c.endMs - c.startMs) / 1000) * (i / Math.max(1, t.length)));
}
const script = JSON.parse(fs.readFileSync(path.resolve('data', `${video}_captions.json`), 'utf8'));
const scriptWords = script.lines.flatMap((l, line) => l.text.split(/\s+/).filter(Boolean).map((text) => ({ text, line })));
const totalChars = scriptWords.reduce((a, w) => a + norm(w.text).length, 0);
const ratio = chars.length / totalChars;
if (Math.abs(1 - ratio) > 0.25) console.warn(`Warning: whisper text length differs from script by ${Math.round((ratio - 1) * 100)}% — check the result.`);
let pos = 0;
const at = (p) => chars[Math.min(chars.length - 1, Math.max(0, Math.round(p * ratio)))];
const words = scriptWords.map((w) => {
  const n = norm(w.text).length;
  const out = { ...w, start: +at(pos).toFixed(3), end: +at(pos + n - 1).toFixed(3) + 0.08 };
  pos += n;
  return out;
});
const lines = script.lines.map((l, i) => {
  const ws = words.filter((w) => w.line === i);
  return { text: l.text, start: ws[0].start, end: ws[ws.length - 1].end };
});
const duration = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${audio}"`).toString());
fs.writeFileSync(path.resolve('data', `${video}_words.json`), JSON.stringify({ source: `whisper.cpp ${model}`, duration, lines, words }, null, 1));
console.log(`Wrote data/${video}_words.json (${words.length} words)`);
