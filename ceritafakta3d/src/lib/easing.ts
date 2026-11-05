export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export type V3 = [number, number, number];

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const backOut = (t: number, s = 1.9) => {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** elastic-ish settle used for drop & bounce */
export const bounceOut = (t: number) => {
  const x = clamp01(t);
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x - 1.5 / d1) * (x - 1.5 / d1) + 0.75;
  if (x < 2.5 / d1) return n1 * (x - 2.25 / d1) * (x - 2.25 / d1) + 0.9375;
  return n1 * (x - 2.625 / d1) * (x - 2.625 / d1) + 0.984375;
};
/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds */
export const prog = (t: number, start: number, dur: number) => clamp01((t - start) / dur);
/** pop-in scale with overshoot */
export const pop = (t: number, start = 0, dur = 0.35) => (t < start ? 0 : backOut(prog(t, start, dur)));
/** drop from height h with bounce; returns y offset */
export const dropY = (t: number, start: number, dur: number, h: number) => (1 - bounceOut(prog(t, start, dur))) * h;
/** heartbeat pulse, 0..1, `bpm` beats per minute */
export const beat = (t: number, bpm = 80) => {
  const ph = (t * bpm) / 60;
  const f = ph - Math.floor(ph);
  return Math.exp(-Math.pow((f - 0.08) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((f - 0.26) / 0.06, 2));
};
/** deterministic pseudo random */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
