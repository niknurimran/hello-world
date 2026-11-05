import React from 'react';
import { FONT, H, TAG_STYLE, TagColor, W } from '../lib/theme';
import { pop, V3 } from '../lib/easing';
import { CamPose, projectToScreen } from '../lib/camera';

export type TagDef = {
  text: string;
  color: TagColor;
  /** world position (or function of scene time) the tag points at */
  at: V3 | ((t: number) => V3);
  /** seconds after scene start to pop in */
  delay?: number;
  rot?: number;
  /** pixel offset from projected point */
  dx?: number;
  dy?: number;
  size?: number;
};

const MARGIN = 30;
const SAFE_RIGHT = 140;

export const TagView: React.FC<{ text: string; color: TagColor; x: number; y: number; rot: number; s: number; size?: number }> = ({
  text, color, x, y, rot, s, size = 44,
}) => {
  const st = TAG_STYLE[color];
  // rough width estimate for clamping inside the frame
  const estW = text.length * size * 0.6 + 44;
  const estH = size * 1.5;
  const cx = Math.min(W - SAFE_RIGHT - estW / 2, Math.max(MARGIN + estW / 2, x));
  const cy = Math.min(1215 - estH / 2, Math.max(330, y));
  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        background: st.bg,
        color: st.fg,
        fontFamily: FONT.sans,
        fontWeight: 800,
        fontSize: size,
        padding: `${size * 0.16}px ${size * 0.42}px ${size * 0.2}px`,
        borderRadius: size * 0.28,
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 18px rgba(0,0,0,0.20)',
        letterSpacing: -0.3,
      }}
    >
      {text}
    </div>
  );
};

export const Tags: React.FC<{ tags: TagDef[]; pose: CamPose; t: number }> = ({ tags, pose, t }) => (
  <>
    {tags.map((tag, i) => {
      const delay = tag.delay ?? 0.25 + i * 0.25;
      const s = pop(t, delay, 0.32);
      if (s <= 0) return null;
      const p = typeof tag.at === 'function' ? tag.at(t) : tag.at;
      const sp = projectToScreen(pose, p);
      if (sp.behind) return null;
      const rot = tag.rot ?? (i % 2 === 0 ? -4 : 4);
      return <TagView key={i} text={tag.text} color={tag.color} x={sp.x + (tag.dx ?? 0)} y={sp.y + (tag.dy ?? 0)} rot={rot} s={s} size={tag.size} />;
    })}
  </>
);
