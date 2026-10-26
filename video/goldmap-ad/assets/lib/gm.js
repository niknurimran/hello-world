// Shared helpers for the Goldmap EA scenes: seeded PRNG, beat grid,
// procedural candlestick chart and a few reusable moves (slam, shake, glitch).
// Everything is a pure function of its inputs, so every frame renders the same.
(function () {
  const GM = (window.GM = {});
  const cfg = () => window.GM_CONFIG;
  const NS = "http://www.w3.org/2000/svg";

  // mulberry32
  GM.prng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Absolute time of beat i, rounded to a whole frame from its index (no drift).
  GM.beat = function (i) {
    const c = cfg();
    return Math.round((i * c.fps * 60) / c.bpm) / c.fps;
  };
  GM.frame = () => 1 / cfg().fps;

  // Slot timing in seconds, and a local-beat helper for scene timelines.
  GM.slot = function (name) {
    const [a, b] = cfg().slots[name];
    const start = GM.beat(a);
    return { start, end: GM.beat(b), dur: GM.beat(b) - start, beats: b - a, lb: (i) => GM.beat(a + i) - start };
  };

  GM.el = function (tag, attrs, parent) {
    const svgTags = /^(svg|g|path|rect|line|circle|polyline|polygon|text|defs|linearGradient|radialGradient|stop|clipPath|mask|ellipse|pattern|filter|feGaussianBlur|use)$/;
    const e = svgTags.test(tag) ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  };

  // Random-walk OHLC candles. `events` maps an index to a forced move (in units of vol).
  GM.candles = function (seed, n, o = {}) {
    const r = GM.prng(seed);
    const vol = o.vol ?? 1;
    let p = o.start ?? 100;
    const out = [];
    for (let i = 0; i < n; i++) {
      const drift = typeof o.drift === "function" ? o.drift(i) : o.drift ?? 0;
      let ch = (r() - 0.5) * 2 * vol + drift * vol;
      if (o.events && o.events[i] !== undefined) ch = o.events[i] * vol;
      const op = p;
      const cl = p + ch;
      const hi = Math.max(op, cl) + r() * vol * 0.55;
      const lo = Math.min(op, cl) - r() * vol * 0.55;
      out.push({ o: op, h: hi, l: lo, c: cl });
      p = cl;
    }
    return out;
  };

  // Builds an SVG candlestick chart (MT-style mobile look, no third-party UI).
  // Returns the svg, the plot group and per-candle elements for animating.
  GM.chart = function (parent, candles, o) {
    const c = cfg().colors;
    const w = o.w, h = o.h;
    const step = o.step ?? 34;
    const bodyW = o.bodyW ?? Math.round(step * 0.62);
    const padT = o.padT ?? 70, padB = o.padB ?? 50, scaleW = o.scaleW ?? 0;
    const win = o.range || candles;
    let min = Infinity, max = -Infinity;
    for (const k of win) { min = Math.min(min, k.l); max = Math.max(max, k.h); }
    const span = max - min || 1;
    const y = (p) => padT + (1 - (p - min) / span) * (h - padT - padB);
    const x = (i) => (o.x0 ?? 30) + i * step + step / 2;

    const svg = GM.el("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: "gm-chart" }, parent);
    const grid = GM.el("g", { stroke: c.white, "stroke-opacity": 0.06, "stroke-width": 1 }, svg);
    for (let gy = padT; gy <= h - padB; gy += (h - padT - padB) / 5) GM.el("line", { x1: 0, x2: w - scaleW, y1: gy, y2: gy }, grid);
    for (let gx = 0; gx <= w; gx += step * 4) GM.el("line", { x1: gx, x2: gx, y1: padT - 20, y2: h - padB }, grid);
    if (scaleW) {
      GM.el("line", { x1: w - scaleW, x2: w - scaleW, y1: 0, y2: h, stroke: c.white, "stroke-opacity": 0.12 }, svg);
      const ticks = GM.el("g", { stroke: c.white, "stroke-opacity": 0.25 }, svg);
      for (let gy = padT; gy <= h - padB; gy += (h - padT - padB) / 10) GM.el("line", { x1: w - scaleW, x2: w - scaleW + 10, y1: gy, y2: gy }, ticks);
    }
    const clipId = "clip" + Math.round(o.seedId ?? w * 7 + h);
    const defs = GM.el("defs", {}, svg);
    const cp = GM.el("clipPath", { id: clipId }, defs);
    GM.el("rect", { x: 0, y: 0, width: w - scaleW, height: h }, cp);
    const view = GM.el("g", { "clip-path": `url(#${clipId})` }, svg);
    const plot = GM.el("g", { class: "gm-plot" }, view);
    const items = candles.map((k, i) => {
      const up = k.c >= k.o;
      const col = up ? c.green : c.red;
      const g = GM.el("g", {}, plot);
      const wick = GM.el("line", { x1: x(i), x2: x(i), y1: y(k.h), y2: y(k.l), stroke: col, "stroke-width": Math.max(2, step * 0.08) }, g);
      const top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c));
      const body = GM.el("rect", { x: x(i) - bodyW / 2, y: top, width: bodyW, height: Math.max(3, bot - top), fill: col, rx: 2 }, g);
      return { g, wick, body, up, x: x(i), yO: y(k.o), yC: y(k.c), k };
    });
    // Bid line that follows the last revealed candle.
    const bid = GM.el("line", { x1: 0, x2: w - scaleW, y1: 0, y2: 0, stroke: c.gold, "stroke-width": 2, "stroke-dasharray": "8 8", opacity: 0.8 }, svg);
    return { svg, plot, view, items, y, x, step, w, h, min, max, bid };
  };

  // Reveal candle i at time t: body/wick grow out of the open price.
  GM.growCandle = function (tl, it, t, dur = 0.12, ease = "power2.out") {
    tl.fromTo(it.g, { opacity: 0 }, { opacity: 1, duration: 0.001 }, t);
    tl.fromTo([it.body, it.wick], { scaleY: 0 }, { scaleY: 1, svgOrigin: `${it.x} ${it.yO}`, duration: dur, ease }, t);
  };

  // Words of an element as inline-block spans (for per-word slams).
  GM.words = function (el, text, accentWord, accentClass) {
    el.textContent = "";
    return text.split(" ").map((w, i, arr) => {
      const s = GM.el("span", { class: "w" + (accentWord && w.toLowerCase() === accentWord.toLowerCase() ? " " + (accentClass || "acc") : "") }, el);
      s.textContent = w;
      if (i < arr.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
  };

  // Slam: lands big-to-size with blur on a hard ease (on the beat).
  GM.slam = function (tl, el, t, o = {}) {
    tl.fromTo(
      el,
      { scale: o.from ?? 1.9, opacity: o.fromOpacity ?? 0, filter: `blur(${o.blur ?? 14}px)` },
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: o.dur ?? 0.16, ease: o.ease ?? "expo.out" },
      t
    );
  };

  // Small decaying camera shake on a wrapper.
  GM.shake = function (tl, el, t, o = {}) {
    const amp = o.amp ?? 18, dur = o.dur ?? 0.3, n = o.n ?? 6, rot = o.rot ?? 0.6;
    const r = GM.prng(o.seed ?? Math.round(t * 1000) + 3);
    const st = dur / n;
    for (let k = 0; k < n; k++) {
      const f = 1 - k / n;
      tl.to(el, { x: (r() - 0.5) * 2 * amp * f, y: (r() - 0.5) * 2 * amp * f, rotation: (r() - 0.5) * 2 * rot * f, duration: st, ease: "none" }, t + k * st);
    }
    tl.to(el, { x: 0, y: 0, rotation: 0, duration: st, ease: "power2.out" }, t + dur);
  };

  // Light digital glitch: a few frames of sliced clip-path + horizontal offsets
  // on `el`, with optional colour ghosts (red/gold) that jump around.
  GM.glitch = function (tl, el, t, o = {}) {
    const frames = o.frames ?? 5, f = GM.frame(), amp = o.amp ?? 26;
    const r = GM.prng(o.seed ?? Math.round(t * 997) + 11);
    for (let k = 0; k < frames; k++) {
      const a = Math.floor(r() * 70), b = Math.min(100, a + 8 + Math.floor(r() * 30));
      tl.set(el, { x: (r() - 0.5) * 2 * amp, clipPath: k % 2 ? `inset(${a}% 0 ${100 - b}% 0)` : "inset(0% 0% 0% 0%)" }, t + k * f);
      (o.ghosts || []).forEach((g, gi) =>
        tl.set(g, { opacity: 0.85, x: (gi ? -1 : 1) * (6 + r() * amp), clipPath: `inset(${Math.floor(r() * 60)}% 0 ${Math.floor(r() * 40)}% 0)` }, t + k * f)
      );
    }
    tl.set(el, { x: 0, clipPath: "inset(0% 0% 0% 0%)" }, t + frames * f);
    (o.ghosts || []).forEach((g) => tl.set(g, { opacity: 0, x: 0 }, t + frames * f));
  };

  // Ghost copies of a text element, for RGB-split glitches.
  GM.ghosts = function (el, colors) {
    return colors.map((col) => {
      const g = el.cloneNode(true);
      g.removeAttribute("id");
      g.classList.add("ghost");
      g.style.color = col;
      g.style.opacity = 0;
      el.parentNode.insertBefore(g, el);
      return g;
    });
  };

  // "Illustration" chart label (kept as a crisp DOM element, never blurred).
  GM.label = function (parent, style) {
    const l = GM.el("div", { class: "gm-illus" }, parent);
    l.textContent = cfg().chart.label;
    Object.assign(l.style, style || {});
    return l;
  };

  // The brand icon: a map pin holding three rising candles (original artwork).
  GM.icon = function (parent, size) {
    const c = cfg().colors;
    const svg = GM.el("svg", { width: size, height: size, viewBox: "0 0 200 200", class: "gm-icon" }, parent);
    const defs = GM.el("defs", {}, svg);
    const lg = GM.el("linearGradient", { id: "gmGold" + size, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    GM.el("stop", { offset: "0", "stop-color": c.goldHi }, lg);
    GM.el("stop", { offset: "0.55", "stop-color": c.gold }, lg);
    GM.el("stop", { offset: "1", "stop-color": c.goldDeep }, lg);
    const pin = GM.el("path", {
      class: "pin",
      d: "M100 12 C 52 12 24 46 24 86 C 24 130 70 160 100 190 C 130 160 176 130 176 86 C 176 46 148 12 100 12 Z",
      fill: "none", stroke: `url(#gmGold${size})`, "stroke-width": 11, "stroke-linejoin": "round",
    }, svg);
    const bars = GM.el("g", { class: "bars" }, svg);
    const spec = [ [70, 100, 132, 88, 120], [100, 76, 128, 62, 104], [130, 56, 106, 42, 84] ]; // x, wickTop, wickBot, bodyTop, bodyBot
    const parts = spec.map(([x, wt, wb, bt, bb]) => {
      const g = GM.el("g", {}, bars);
      GM.el("line", { x1: x, x2: x, y1: wt - 12, y2: wb, stroke: `url(#gmGold${size})`, "stroke-width": 5, "stroke-linecap": "round" }, g);
      GM.el("rect", { x: x - 10, y: bt, width: 20, height: bb - bt, rx: 3, fill: `url(#gmGold${size})` }, g);
      return g;
    });
    return { svg, pin, parts };
  };

  // Flat, original cursor pointer.
  GM.cursor = function (parent, size) {
    const svg = GM.el("svg", { width: size, height: size, viewBox: "0 0 64 64", class: "gm-cursor" }, parent);
    GM.el("path", { d: "M10 4 L10 50 L22 39 L31 60 L40 56 L31 35 L48 35 Z", fill: "#fff", stroke: "#0B0B0F", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    return svg;
  };
})();
