export type Word = { text: string; start: number; end: number; line: number };
export type Line = { text: string; start: number; end: number };
export type WordsFile = { duration: number; lines: Line[]; words: Word[] };

/** Anchor = [line index, word index inside that line] (0-based). */
export type Anchor = [number, number];

export const wordsOfLine = (data: WordsFile, line: number) => data.words.filter((w) => w.line === line);

export const anchorTime = (data: WordsFile, [line, word]: Anchor) => {
  const ws = wordsOfLine(data, line);
  const w = ws[word];
  if (!w) throw new Error(`Anchor ${line}:${word} not found`);
  return w.start;
};

/**
 * Scene start frames: each scene cuts LEAD seconds before the first word of its phrase.
 * Returns [startFrame, endFrame) per scene; the first scene starts at 0, the last ends at `total`.
 */
export const sceneFrames = (data: WordsFile, anchors: Anchor[], fps: number, total: number, lead = 0.12) => {
  const starts = anchors.map((a, i) => (i === 0 ? 0 : Math.max(0, Math.round((anchorTime(data, a) - lead) * fps))));
  return starts.map((s, i) => [s, i + 1 < starts.length ? starts[i + 1] : total] as [number, number]);
};

/** Caption line visible at time t: the latest line that has started (first line before speech starts). */
export const lineAt = (data: WordsFile, t: number) => {
  let idx = 0;
  data.lines.forEach((l, i) => {
    if (t >= l.start - 0.12) idx = i;
  });
  return idx;
};
