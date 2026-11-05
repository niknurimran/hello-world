// Builds data/<video>_words.json (word-level timestamps) WITHOUT whisper.
// Source priority: data/<video>_segments.json (silence-detected phrases) → data/<video>_captions.json (lines).
// Inside each phrase, words are spread by character length (spec fallback in CLAUDE.md).
// Usage: node scripts/make-words.mjs v01
import fs from 'node:fs';
import path from 'node:path';

const video = process.argv[2] ?? 'v01';
const dataDir = path.resolve('data');
const capPath = path.join(dataDir, `${video}_captions.json`);
const segPath = path.join(dataDir, `${video}_segments.json`);
const outPath = path.join(dataDir, `${video}_words.json`);

const captions = JSON.parse(fs.readFileSync(capPath, 'utf8'));
const segments = fs.existsSync(segPath)
  ? JSON.parse(fs.readFileSync(segPath, 'utf8')).segments
  : captions.lines.map((l, i) => ({ line: i, start: l.start, end: l.end, text: l.text }));

const words = [];
for (const seg of segments) {
  const toks = seg.text.split(/\s+/).filter(Boolean);
  const weights = toks.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = seg.start;
  toks.forEach((tok, i) => {
    const dur = ((seg.end - seg.start) * weights[i]) / total;
    words.push({ text: tok, start: +t.toFixed(3), end: +(t + dur).toFixed(3), line: seg.line });
    t += dur;
  });
}

// sanity check: words of each line must rebuild the caption text
captions.lines.forEach((l, i) => {
  const rebuilt = words.filter((w) => w.line === i).map((w) => w.text).join(' ');
  if (rebuilt !== l.text) throw new Error(`Line ${i} mismatch:\n  "${rebuilt}"\n  "${l.text}"`);
});

const lines = captions.lines.map((l, i) => {
  const ws = words.filter((w) => w.line === i);
  return { text: l.text, start: ws[0].start, end: ws[ws.length - 1].end };
});

fs.writeFileSync(
  outPath,
  JSON.stringify({ source: fs.existsSync(segPath) ? 'segments+char-length' : 'captions+char-length', duration: fs.existsSync(segPath) ? JSON.parse(fs.readFileSync(segPath, "utf8")).duration : captions.duration, lines, words }, null, 1),
);
console.log(`Wrote ${outPath}: ${words.length} words, ${lines.length} lines`);
