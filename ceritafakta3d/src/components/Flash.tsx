import React from 'react';
import { AbsoluteFill } from 'remotion';

/** 3-frame white flash at a cut. `f` = frames since scene start. */
export const Flash: React.FC<{ f: number }> = ({ f }) => {
  if (f > 2) return null;
  const o = [0.4, 0.25, 0.1][f] ?? 0;
  return <AbsoluteFill style={{ background: '#fff', opacity: o }} />;
};

/** Red pulsing warning on the frame edges. */
export const EdgeWarning: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  if (t < start) return null;
  const a = 0.35 + 0.35 * Math.max(0, Math.sin((t - start) * Math.PI * 3));
  return <AbsoluteFill style={{ boxShadow: `inset 0 0 160px 40px rgba(239,68,68,${a})` }} />;
};
