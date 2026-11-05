import React from 'react';
import { C, FONT, W } from '../lib/theme';
import { easeOutCubic, pop, prog } from '../lib/easing';

const panelBase: React.CSSProperties = {
  position: 'absolute',
  background: 'rgba(22,24,29,0.94)',
  borderRadius: 22,
  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
  color: '#fff',
  fontFamily: FONT.mono,
};

/** Dark panel under the chip that pops in. */
export const PanelBox: React.FC<{ t: number; delay?: number; top?: number; width?: number; children: React.ReactNode }> = ({
  t, delay = 0.15, top = 320, width = 620, children,
}) => {
  const s = pop(t, delay, 0.35);
  if (s <= 0) return null;
  return (
    <div style={{ ...panelBase, top, left: (W - width) / 2, width, padding: '22px 30px 18px', transform: `scale(${s})`, transformOrigin: '50% 0%' }}>
      {children}
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#9AA0AC' }) => (
  <div style={{ fontSize: 22, letterSpacing: 4, color, textAlign: 'center', marginTop: 10, fontWeight: 700 }}>{children}</div>
);

/** ECG line that beats, then goes flat red at `flatAt` seconds. */
export const EcgPanel: React.FC<{ t: number; flatAt: number; label: string }> = ({ t, flatAt, label }) => {
  const w = 560, h = 120;
  const flat = t >= flatAt;
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 4) {
    const time = t - (w - x) / 260; // scroll speed
    let y = h / 2;
    if (time < flatAt) {
      const ph = ((time * 1.4) % 1 + 1) % 1;
      y -= 52 * Math.exp(-Math.pow((ph - 0.5) / 0.018, 2));
      y += 22 * Math.exp(-Math.pow((ph - 0.53) / 0.02, 2));
      y -= 10 * Math.exp(-Math.pow((ph - 0.72) / 0.05, 2));
    }
    pts.push(`${x},${y.toFixed(1)}`);
  }
  const col = flat ? C.red : '#3DDC84';
  return (
    <PanelBox t={t} width={620}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="#2A2E36" strokeWidth={2} />
        <polyline points={pts.join(' ')} fill="none" stroke={col} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={w - 2} cy={h / 2} r={8} fill={col} />
      </svg>
      <Label color={flat ? C.red : '#9AA0AC'}>{flat ? `${label} · BERHENTI` : label}</Label>
    </PanelBox>
  );
};

/** Ruler-style progress bar (e.g. 2/3). */
export const BarPanel: React.FC<{ t: number; value: number; ticks: string[]; label: string; color?: string; delay?: number }> = ({
  t, value, ticks, label, color = C.yellow, delay = 0.15,
}) => {
  const fill = value * easeOutCubic(prog(t, delay + 0.25, 0.8));
  const w = 540;
  return (
    <PanelBox t={t} delay={delay}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        {ticks.map((tk) => (
          <span key={tk}>{tk}</span>
        ))}
      </div>
      <div style={{ position: 'relative', width: w, height: 18, background: '#2E323B', borderRadius: 9, margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w * fill, background: color, borderRadius: 9 }} />
        {ticks.map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: (w * i) / (ticks.length - 1) - 1, top: -6, width: 3, height: 30, background: '#555B66' }} />
        ))}
      </div>
      <Label>{label}</Label>
    </PanelBox>
  );
};

/** Big counter (1-2-3) that ticks up at given times. */
export const CounterPanel: React.FC<{ t: number; times: number[]; label: string; color?: string }> = ({ t, times, label, color = C.red }) => {
  const n = times.filter((x) => t >= x).length;
  const last = times[n - 1] ?? 0;
  const s = n > 0 ? 1 + 0.25 * (1 - easeOutCubic(prog(t, last, 0.25))) : 1;
  return (
    <PanelBox t={t} width={300} delay={0.05}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 96, lineHeight: 1, textAlign: 'center', color, transform: `scale(${s})` }}>
        {n}
      </div>
      <Label>{label}</Label>
    </PanelBox>
  );
};

/** Battery icon positioned in screen pixels. level 0..1 */
export const Battery: React.FC<{ x: number; y: number; level: number; s?: number }> = ({ x, y, level, s = 1 }) => {
  const col = level > 0.5 ? C.green : level > 0.25 ? C.yellow : C.red;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})` }}>
      <div style={{ position: 'relative', width: 150, height: 72, border: '8px solid #16181D', borderRadius: 16, background: '#fff', boxSizing: 'border-box' }}>
        <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: Math.max(0, 122 * level), background: col, borderRadius: 6 }} />
        <div style={{ position: 'absolute', right: -22, top: 16, width: 12, height: 24, background: '#16181D', borderRadius: 4 }} />
      </div>
    </div>
  );
};

/** "Next video" teaser card. */
export const TeaserCard: React.FC<{ t: number; delay: number; badge: string; text: string }> = ({ t, delay, badge, text }) => {
  const s = pop(t, delay, 0.4);
  if (s <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute', top: 330, left: 90, width: 760,
        background: '#fff', borderRadius: 28, padding: '28px 34px 30px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.22)', transform: `scale(${s}) rotate(-2deg)`, transformOrigin: '50% 0%',
        fontFamily: FONT.sans,
      }}
    >
      <span style={{ background: C.yellow, color: '#2A2000', fontWeight: 900, fontSize: 34, borderRadius: 10, padding: '4px 16px' }}>{badge}</span>
      <div style={{ marginTop: 16, fontWeight: 800, fontSize: 50, lineHeight: 1.15, color: C.ink }}>{text}</div>
    </div>
  );
};

/** Divider for split-screen scenes. */
export const SplitDivider: React.FC<{ t: number }> = ({ t }) => {
  const p = easeOutCubic(prog(t, 0, 0.3));
  return <div style={{ position: 'absolute', left: W / 2 - 4, top: 300, width: 8, height: 1000 * p, background: '#fff', borderRadius: 4, boxShadow: '0 0 12px rgba(0,0,0,0.2)' }} />;
};
