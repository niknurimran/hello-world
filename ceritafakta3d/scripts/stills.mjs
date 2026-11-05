// Render review stills (bundles once). Usage:
//   node scripts/stills.mjs V01-SotongKurita 30,120,300        → out/stills/f<frame>.png
//   node scripts/stills.mjs V01-SotongKurita scenes             → one still per scene (60% through it)
// Env: GL=angle|swangle|vulkan|egl (default angle), REMOTION_BROWSER=/path/to/chrome (optional)
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const [compId = 'V01-SotongKurita', which = 'scenes'] = process.argv.slice(2);
const gl = process.env.GL ?? 'angle';
const outDir = path.resolve('out/stills');
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable, chromiumOptions: { gl } });

let frames;
if (which === 'scenes') {
  const { sceneStarts } = await import(path.resolve('out/.scene-starts.mjs')).catch(() => ({ sceneStarts: null }));
  if (!sceneStarts) throw new Error('Run with explicit frames, or generate out/.scene-starts.mjs first');
  frames = sceneStarts;
} else {
  frames = which.split(',').map(Number);
}
for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({ serveUrl, composition, frame, output, browserExecutable, chromiumOptions: { gl }, overwrite: true });
  console.log('wrote', output);
}
