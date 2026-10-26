import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Evaluates config.js (a browser script) and returns window.GM_CONFIG.
export function loadConfig(root) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "config.js"), "utf8"), ctx);
  return ctx.window.GM_CONFIG;
}

// Same rounding as GM.beat in assets/lib/gm.js.
export function beat(cfg, i) {
  return Math.round((i * cfg.fps * 60) / cfg.bpm) / cfg.fps;
}

export function readWavSeconds(file) {
  const b = fs.readFileSync(file);
  const byteRate = b.readUInt32LE(28);
  let off = 12;
  while (off < b.length - 8) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "data") return size / byteRate;
    off += 8 + size;
  }
  throw new Error("no data chunk in " + file);
}
