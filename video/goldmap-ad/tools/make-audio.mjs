// Generates the hype music bed and the SFX from code (no samples, no downloads).
// Usage: node tools/make-audio.mjs   → assets/generated_hype.wav + assets/audio/sfx_*.wav
// Everything is seeded, so the same config gives the same files.
import fs from "node:fs";
import path from "node:path";
import { loadConfig, beat } from "./lib.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cfg = loadConfig(root);
const SR = 48000;
const TAU = Math.PI * 2;

function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(cfg.audio.seed);
const noise = () => rnd() * 2 - 1;

// --- tiny DSP helpers ---------------------------------------------------------
function biquad(type, freq, q) {
  // RBJ cookbook; freq may be a function of the sample index for sweeps.
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, n) => {
    const f = typeof freq === "function" ? freq(n) : freq;
    const w = (TAU * Math.min(f, SR * 0.45)) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === "lp") { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
    else if (type === "hp") { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; } // band-pass
    const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
const sat = (x, d = 1.5) => Math.tanh(x * d) / Math.tanh(d);

function buf(sec) { return { L: new Float32Array(Math.ceil(sec * SR)), R: new Float32Array(Math.ceil(sec * SR)) }; }
function add(dst, src, at, gain = 1, pan = 0) {
  const o = Math.round(at * SR), gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < src.length && o + i < dst.L.length; i++) {
    if (o + i < 0) continue;
    dst.L[o + i] += src[i] * gl;
    dst.R[o + i] += src[i] * gr;
  }
}

// --- instruments (mono Float32Arrays) -----------------------------------------
function kick() {
  const n = Math.round(0.42 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 45 + 125 * Math.exp(-t * 32);
    ph += (TAU * f) / SR;
    const body = Math.sin(ph) * Math.exp(-t * 7.5);
    const click = t < 0.004 ? noise() * (1 - t / 0.004) * 0.5 : 0;
    out[i] = sat(body * 1.2 + click, 2);
  }
  return out;
}
function clap() {
  const n = Math.round(0.3 * SR), out = new Float32Array(n);
  const bp = biquad("bp", 1400, 0.9), hp = biquad("hp", 600, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let env = Math.exp(-(t - 0.024) * 18) * (t > 0.024 ? 1 : 0);
    for (const s of [0, 0.009, 0.017]) if (t >= s && t < s + 0.008) env = Math.max(env, Math.exp(-(t - s) * 300));
    out[i] = hp(bp(noise(), i), i) * env * 2.6;
  }
  return out;
}
function hat(open) {
  const n = Math.round((open ? 0.22 : 0.05) * SR), out = new Float32Array(n);
  const hp = biquad("hp", 7500, 0.8);
  for (let i = 0; i < n; i++) out[i] = hp(noise(), i) * Math.exp(-(i / SR) * (open ? 14 : 70)) * 0.9;
  return out;
}
function snare() {
  const n = Math.round(0.16 * SR), out = new Float32Array(n);
  const bp = biquad("bp", 2200, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (bp(noise(), i) * 1.6 + Math.sin(TAU * 190 * t) * 0.5) * Math.exp(-t * 26);
  }
  return out;
}
// Bass note: sine sub + saturated saw an octave up (so phones hear it).
function bass(freq, sec) {
  const n = Math.round(sec * SR), out = new Float32Array(n);
  const lp = biquad("lp", 900, 0.9);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    p1 += freq / SR; p2 += (freq * 2.003) / SR;
    const sub = Math.sin(TAU * p1);
    const saw = lp(2 * (p2 % 1) - 1, i);
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 3.2) * (t > sec - 0.02 ? (sec - t) / 0.02 : 1);
    out[i] = sat(sub * 0.85 + saw * 0.45, 1.8) * env;
  }
  return out;
}
// Detuned saw chord stab.
function stab(freqs, sec, bright) {
  const n = Math.round(sec * SR), out = new Float32Array(n);
  const lp = biquad("lp", (i) => 900 + bright * 3200 * Math.exp(-(i / SR) * 9), 1.1);
  const ph = [];
  freqs.forEach((f) => [-0.12, 0, 0.12].forEach((d) => ph.push({ f: f * Math.pow(2, d / 12), p: rnd() })));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const o of ph) { o.p += o.f / SR; s += 2 * (o.p % 1) - 1; }
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 7) * (t > sec - 0.015 ? (sec - t) / 0.015 : 1);
    out[i] = lp(s / ph.length, i) * env;
  }
  return out;
}
function impact() {
  const n = Math.round(1.8 * SR), out = new Float32Array(n);
  const lp = biquad("lp", (i) => 6000 * Math.exp(-(i / SR) * 5) + 200, 0.7);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (TAU * (32 + 70 * Math.exp(-t * 9))) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 2.4);
    const crash = lp(noise(), i) * Math.exp(-t * 3.5) * 0.7;
    out[i] = sat(boom * 1.3 + crash, 1.6);
  }
  return out;
}
function riser(sec) {
  const n = Math.round(sec * SR), out = new Float32Array(n);
  const bp = biquad("bp", (i) => 300 * Math.pow(30, i / n), 1.4);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    ph += (TAU * (180 * Math.pow(10, x))) / SR;
    out[i] = (bp(noise(), i) * 1.4 + Math.sin(ph) * 0.18) * Math.pow(x, 1.6);
  }
  return out;
}

// --- arrangement --------------------------------------------------------------
const last = Math.max(...Object.values(cfg.slots).map((s) => s[1]));
const total = beat(cfg, last);
const spb = 60 / cfg.bpm;
const dropBeat = cfg.slots.shift[0];
const riserBeats = cfg.audio.riserBars * 4;
const mix = buf(total + 0.05);
const T = (b) => beat(cfg, b);

// F minor: Fm – Db – Ab – Eb, one chord per bar.
const prog = [
  { root: 87.31, chord: [349.23, 415.3, 523.25] },  // Fm  (F3 / F4 Ab4 C5)
  { root: 69.3, chord: [277.18, 349.23, 415.3] },   // Db
  { root: 103.83, chord: [311.13, 415.3, 523.25] }, // Ab  (Eb4 Ab4 C5)
  { root: 77.78, chord: [311.13, 392.0, 466.16] },  // Eb
];

const K = kick(), CL = clap(), HC = hat(false), HO = hat(true), SN = snare(), IM = impact();

for (let b = 0; b < last; b++) {
  const bar = Math.floor(b / 4), ch = prog[bar % 4];
  const inRiser = b >= dropBeat - riserBeats && b < dropBeat;
  const drop = b >= dropBeat;
  const endCard = b >= cfg.slots.cta[0];

  // Kick 4-on-the-floor (drops out for the last 2 beats of the riser).
  if (!(inRiser && b >= dropBeat - 2)) add(mix, K, T(b), 0.95);
  // Clap on 2 and 4.
  if (b % 2 === 1 && !(inRiser && b >= dropBeat - 2)) add(mix, CL, T(b), drop ? 0.55 : 0.45, 0.05);
  // Hats: 1/8 (offbeat open hats after the drop).
  for (let e = 0; e < 2; e++) {
    const t = T(b) + e * spb / 2;
    if (e === 1 && drop && !endCard) add(mix, HO, t, 0.22, 0.25);
    else add(mix, HC, t, e ? 0.3 : 0.18, -0.2);
  }
  if (drop && !endCard) for (const s of [0.25, 0.75]) add(mix, HC, T(b) + s * spb, 0.12, 0.3);
  // Bass on the offbeat 8ths (pumps against the kick).
  if (!(inRiser && b >= dropBeat - 2)) add(mix, bass(ch.root, spb / 2 - 0.01), T(b) + spb / 2, drop ? 0.55 : 0.45);
  // Saw stabs: sparse before the drop, every offbeat after it.
  if (drop && !endCard) add(mix, stab(ch.chord, spb / 2 - 0.02, 1), T(b) + spb / 2, 0.24, b % 2 ? 0.3 : -0.3);
  else if (!drop && b % 4 === 3 && !inRiser) add(mix, stab(ch.chord, spb * 0.9, 0.5), T(b) + spb / 2, 0.14);
}
// Snare roll + riser into the drop.
const rStart = T(dropBeat - riserBeats);
add(mix, riser(T(dropBeat) - rStart), rStart, 1.1);
for (let k = 0; k < riserBeats * 4; k++) {
  const x = k / (riserBeats * 4);
  if (x < 0.5 && k % 2) continue; // 8ths, then 16ths
  add(mix, SN, rStart + (k * spb) / 4, 0.2 + 0.6 * x, (k % 2 ? 0.15 : -0.15));
}
// Impacts.
for (const b of cfg.audio.impacts) add(mix, IM, T(b), 0.9);
add(mix, IM, T(dropBeat), 0.75);

// Fade-out on the end card, then a soft clip that only touches the loudest peaks
// (the final level is set by loudnorm after the render).
const fadeStart = total - cfg.audio.fadeOutSec;
let mpk = 0;
for (let i = 0; i < mix.L.length; i++) mpk = Math.max(mpk, Math.abs(mix.L[i]), Math.abs(mix.R[i]));
const pre = 1.3 / mpk;
for (let i = 0; i < mix.L.length; i++) {
  const t = i / SR;
  let g = pre;
  if (t >= fadeStart) g *= Math.max(0, (total - t) / cfg.audio.fadeOutSec);
  mix.L[i] = sat(mix.L[i] * g, 1);
  mix.R[i] = sat(mix.R[i] * g, 1);
}

// --- SFX ----------------------------------------------------------------------
function whoosh(sec, f0, f1, seedShift) {
  for (let s = 0; s < seedShift; s++) rnd();
  const n = Math.round(sec * SR), out = new Float32Array(n);
  const bp = biquad("bp", (i) => { const x = i / n; return f0 * Math.pow(f1 / f0, Math.sin(Math.PI * x)); }, 1.2);
  for (let i = 0; i < n; i++) { const x = i / n; out[i] = bp(noise(), i) * Math.pow(Math.sin(Math.PI * x), 2) * 2.2; }
  return out;
}
function click(f) {
  const n = Math.round(0.06 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] = (Math.sin(TAU * f * t) * Math.exp(-t * 90) + (t < 0.002 ? noise() * 0.8 : 0)) * 0.9; }
  return out;
}
function pop(f0, f1) {
  const n = Math.round(0.09 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (TAU * (f1 + (f0 - f1) * Math.exp(-t * 60))) / SR; out[i] = Math.sin(ph) * Math.exp(-t * 38) * 0.9; }
  return out;
}
function glitch(sec, seedShift) {
  for (let s = 0; s < seedShift; s++) rnd();
  const n = Math.round(sec * SR), out = new Float32Array(n);
  let seg = 0, f = 400, hold = 0, mode = 0;
  for (let i = 0; i < n; i++) {
    if (i >= seg) { seg = i + Math.round((0.012 + rnd() * 0.03) * SR); f = 150 + rnd() * 2400; mode = Math.floor(rnd() * 3); }
    const t = i / SR;
    let v = mode === 0 ? Math.sign(Math.sin(TAU * f * t)) * 0.5 : mode === 1 ? noise() * 0.6 : 0;
    if (i % 6 === 0) hold = v; // crude sample-rate reduction
    out[i] = hold * (1 - i / n) * 0.8;
  }
  return out;
}
const sfx = {
  whoosh_a: whoosh(0.42, 400, 5200, 1),
  whoosh_b: whoosh(0.36, 650, 7000, 7),
  click_a: click(2600),
  click_b: click(3400),
  pop_a: pop(900, 420),
  pop_b: pop(1200, 560),
  glitch_a: glitch(0.22, 3),
  glitch_b: glitch(0.32, 11),
};

// --- write --------------------------------------------------------------------
function writeWav(file, L, R) {
  const n = L.length, data = Buffer.alloc(n * 4);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0.891 ? 0.891 / peak : 1; // keep sample peaks at or under -1 dBFS
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, data]));
  return (20 * Math.log10(peak * g)).toFixed(1);
}
console.log(`${cfg.audio.music}: ${total} s, peak ${writeWav(path.join(root, cfg.audio.music), mix.L, mix.R)} dBFS`);
for (const [name, s] of Object.entries(sfx)) {
  console.log(`assets/audio/sfx_${name}.wav: peak ${writeWav(path.join(root, `assets/audio/sfx_${name}.wav`), s, s)} dBFS`);
}
