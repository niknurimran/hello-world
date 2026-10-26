// Writes the scene hosts and audio clips into index.html from config.js,
// so slot timing and SFX cues are edited in one place.
// Usage: node tools/sync.mjs
import fs from "node:fs";
import path from "node:path";
import { loadConfig, beat, readWavSeconds } from "./lib.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cfg = loadConfig(root);
const r3 = (n) => Math.round(n * 1000) / 1000;

const order = ["hook", "brand", "problem", "shift", "demo", "how", "urgency", "cta"];
const total = beat(cfg, Math.max(...Object.values(cfg.slots).map((s) => s[1])));
const W = cfg.width, H = cfg.height;

const host = (id, start, dur, track, z) =>
  `      <div id="${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" ` +
  `data-start="${r3(start)}" data-duration="${r3(dur)}" data-track-index="${track}" data-track-kind="graphics" ` +
  `data-width="${W}" data-height="${H}" style="z-index:${z}"></div>`;

const hosts = [host("bg", 0, total, 0, 1)];
for (const id of order) {
  const [a, b] = cfg.slots[id];
  hosts.push(host(id, beat(cfg, a), beat(cfg, b) - beat(cfg, a), 1, 5));
}
const riskStart = beat(cfg, cfg.slots[cfg.text.cta.disclaimerFrom][0]);
hosts.push(host("risk", riskStart, total - riskStart, 2, 15));
hosts.push(host("fx", 0, total, 2, 20));

// Audio: music bed + SFX cues. Each SFX kind gets its own track.
const audio = [];
const musicPath = path.join(root, cfg.audio.music);
if (fs.existsSync(musicPath)) {
  const d = Math.min(total, readWavSeconds(musicPath));
  audio.push(
    `      <audio id="music" class="clip" src="${cfg.audio.music}" data-start="0" data-duration="${r3(d)}" ` +
      `data-track-index="3" data-volume="${cfg.audio.musicVolume}"></audio>`
  );
}
const tracks = {};
let n = 0;
for (const cue of cfg.audio.sfx || []) {
  const file = `assets/audio/sfx_${cue.file}.wav`;
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const kind = cue.file.replace(/_[a-z0-9]+$/, "");
  if (!(kind in tracks)) tracks[kind] = 4 + Object.keys(tracks).length;
  const t = beat(cfg, cfg.slots[cue.slot][0] + cue.beat) + (cue.offset || 0);
  const d = Math.min(readWavSeconds(p), total - t);
  audio.push(
    `      <audio id="sfx-${++n}-${cue.file.replace(/_/g, "-")}" class="clip" src="${file}" data-start="${r3(Math.max(0, t))}" ` +
      `data-duration="${r3(d)}" data-track-index="${tracks[kind]}" data-volume="${cue.vol ?? cfg.audio.sfxVolume}"></audio>`
  );
}

const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");
const swap = (tag, lines) =>
  (html = html.replace(
    new RegExp(`(<!-- ${tag}:BEGIN[^\\n]*\\n)[\\s\\S]*?(\\s*<!-- ${tag}:END -->)`),
    (_, a, b) => a + lines.join("\n") + "\n      " + b.trimStart()
  ));
swap("HOSTS", hosts);
swap("AUDIO", audio);
html = html.replace(/(id="stage"[^>]*data-duration=")[^"]*"/, `$1${r3(total)}"`);
fs.writeFileSync(file, html);
console.log(`index.html: ${hosts.length} hosts, ${audio.length} audio clips, ${r3(total)} s`);
