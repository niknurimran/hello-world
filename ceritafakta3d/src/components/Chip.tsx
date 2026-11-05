import React from 'react';
import { C, FONT, W } from '../lib/theme';
import { easeOutCubic, prog } from '../lib/easing';

/** Top scene label: black pill, coloured dot, white monospace caps. `t` = seconds since scene start. */
export const Chip: React.FC<{ text: string; dot: string; t: number }> = ({ text, dot, t }) => {
  const p = easeOutCubic(prog(t, 0, 0.28));
  return (
    <div
      style={{
        position: 'absolute',
        top: 250 - 34,
        left: 0,
        width: W,
        display: 'flex',
        justifyContent: 'center',
        opacity: p,
        transform: `translateY(${(1 - p) * -26}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: C.chip,
          color: '#fff',
          borderRadius: 999,
          padding: '14px 34px 14px 26px',
          fontFamily: FONT.mono,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 6,
          boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 8, background: dot, flex: 'none' }} />
        <span>{text}</span>
      </div>
    </div>
  );
};
