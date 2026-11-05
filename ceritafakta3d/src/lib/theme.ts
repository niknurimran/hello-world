export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  ink: '#14161A',
  chip: '#16181D',
  grey: '#B7BAC2',
  orange: '#FF5A36',
  green: '#3DDC84',
  yellow: '#FFD23F',
  red: '#EF4444',
  blue: '#4CC9F0',
  pink: '#FF7EB6',
  copper: '#C8773E',
  white: '#FFFFFF',
  // 3D palette (matte, saturated, not neon)
  skin: '#E8B48C',
  shirt: '#1FA39A',
  pants: '#23305A',
  hair: '#1B1B1F',
  octo: '#F2724E',
  octoDark: '#D9573A',
  heart: '#E23B4A',
  sand: '#E9D6A8',
  rock: '#8E95A3',
  weed: '#3FAF6B',
};

export const FONT = {
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'Menlo', monospace",
};

export type TagColor = 'green' | 'yellow' | 'red' | 'blue' | 'black' | 'pink' | 'copper';
export const TAG_STYLE: Record<TagColor, { bg: string; fg: string }> = {
  green: { bg: C.green, fg: '#0B2416' },
  yellow: { bg: C.yellow, fg: '#2A2000' },
  red: { bg: C.red, fg: '#FFFFFF' },
  blue: { bg: C.blue, fg: '#062433' },
  black: { bg: C.chip, fg: '#FFFFFF' },
  pink: { bg: C.pink, fg: '#3A0A1F' },
  copper: { bg: C.copper, fg: '#FFFFFF' },
};
