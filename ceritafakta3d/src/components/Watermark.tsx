import React from 'react';
import { FONT, H, W } from '../lib/theme';

export const Watermark: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div
    style={{
      position: 'absolute',
      top: H - 150 - 30,
      left: 0,
      width: W,
      textAlign: 'center',
      fontFamily: FONT.mono,
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: 5,
      color: dark ? '#fff' : '#2A2D33',
      opacity: 0.45,
    }}
  >
    @CERITAFAKTA3D
  </div>
);
