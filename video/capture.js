// Usage: node capture.js <videoId> [--preview t1,t2,...]
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const DIR = __dirname;
const FPS = 30;
const id = process.argv[2];
const previewArg = process.argv.indexOf('--preview');
const preview = previewArg > -1 ? process.argv[previewArg + 1].split(',').map(Number) : null;

(async () => {
  const { VIDEOS } = require('./scenes.js');
  const v = VIDEOS.find(x => x.id === id);
  const tl = JSON.parse(fs.readFileSync(path.join(DIR, `${id}-timeline.json`), 'utf8'));
  // Uses CHROME_PATH if set, otherwise the Google Chrome installed on this computer.
  const launch = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH; else launch.channel = 'chrome';
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(require('url').pathToFileURL(path.join(DIR, 'render.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(([i, t]) => window.setup(i, t), [id, tl]);
  const stage = await page.$('#stage');

  if (preview) {
    for (const t of preview) {
      await page.evaluate(x => window.renderAt(x), t);
      await stage.screenshot({ path: path.join(DIR, `prev-${id}-${t}.png`) });
    }
    console.log('preview done', errors);
    await browser.close();
    return;
  }

  const out = path.join(DIR, `${v.file}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(DIR, `${id}.wav`), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(tl.total * FPS);
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    await page.evaluate(x => window.renderAt(x), f / FPS);
    const buf = await stage.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(id, f, '/', n, Math.round((Date.now() - t0) / 1000) + 's');
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out, 'errors:', errors.length ? errors.slice(0, 3) : 'none');
})();
