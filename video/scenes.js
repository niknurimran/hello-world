// Shared scene data + animated art for the Goldmap EA rough cuts.
// Works in the browser (window.GM) and in Node (module.exports).
(function (root) {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const prog = (k, start, dur) => clamp((k - start) / dur);
  const ease = x => 1 - Math.pow(1 - x, 3);
  const pe = (k, s, d) => ease(prog(k, s, d));
  const lerp = (a, b, x) => a + (b - a) * x;

  const r = (x, y, w, h, rx, cls, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}" ${ex}/>`;
  const t = (x, y, s, cls, txt, a = 'start', w = 700, ex = '') => `<text x="${x}" y="${y}" font-size="${s}" class="${cls}" text-anchor="${a}" font-weight="${w}" ${ex}>${txt}</text>`;
  const c = (x, y, rad, cls, ex = '') => `<circle cx="${x}" cy="${y}" r="${rad}" class="${cls}" ${ex}/>`;
  const p = (d, cls, ex = '') => `<path d="${d}" class="${cls}" ${ex}/>`;
  const ln = (x1, y1, x2, y2, cls, ex = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${ex}/>`;
  const g = (inner, ex = '') => `<g ${ex}>${inner}</g>`;
  const op = v => `opacity="${clamp(v).toFixed(3)}"`;
  const draw = v => `pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - clamp(v)).toFixed(4)}"`;
  const pop = (v, cx, cy) => { const s = lerp(0.6, 1, ease(clamp(v))); return `opacity="${clamp(v * 2).toFixed(3)}" transform="translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})"`; };
  const money = n => '$' + Math.round(n).toLocaleString('en-US');

  function candles(n, x0, x1, yTop, yBot, seed, drift = 0, shown = n) {
    let out = '', price = (yTop + yBot) / 2, s = seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const o = price;
      const cl = Math.min(yBot - 6, Math.max(yTop + 6, price + (rnd() - .5) * 24 + drift));
      const hi = Math.min(o, cl) - rnd() * 8, lo = Math.max(o, cl) + rnd() * 8;
      const up = cl < o, x = x0 + i * w + w / 2;
      if (i < shown) {
        out += ln(x, hi, x, lo, up ? 'sg' : 'sm', 'stroke-width="1"');
        out += r(x - w * .3, Math.min(o, cl), w * .6, Math.max(1.5, Math.abs(cl - o)), 0, up ? 'fg' : 'fm');
      }
      price = cl;
    }
    return out;
  }
  const shield = (cx, cy, k = 1) => `M${cx} ${cy - 14 * k} L${cx + 12 * k} ${cy - 9 * k} V${cy + 1 * k} C${cx + 12 * k} ${cy + 9 * k} ${cx} ${cy + 14 * k} ${cx} ${cy + 14 * k} C${cx} ${cy + 14 * k} ${cx - 12 * k} ${cy + 9 * k} ${cx - 12 * k} ${cy + 1 * k} V${cy - 9 * k} Z`;
  const tag = (x, y, txt) => g(r(x, y, 22, 13, 3, 'fl') + t(x + 11, y + 9.3, 6.5, 'ft', txt, 'middle', 700));
  const card = (x, y, w, h) => r(x, y, w, h, 8, 'fc', 'stroke-width="0.8"');

  // Each art function: (k = seconds into the scene) => SVG string. Top-level <g> groups get the generic stagger-in.
  const A = {
    glitch: k => {
      const jit = k < 1.4 ? Math.sin(k * 90) * 3 * (1 - k / 1.4) : 0;
      const fl = Math.floor(k * 14) % 3 === 0 ? .2 : .6;
      return g(candles(15, 12, 168, 110, 245, 7, 0, Math.min(15, Math.floor(k * 22) + 1)), `transform="translate(${jit.toFixed(2)} 0)"`) +
        g(r(20, 150, 90, 3, 0, 'fr') + r(70, 196, 100, 2, 0, 'fr') + r(10, 222, 60, 2.5, 0, 'ft', 'opacity=".4"'), `opacity="${k < 1.6 ? fl : .35}" transform="translate(${(-jit * 1.5).toFixed(2)} 0)"`) +
        g(t(42, 150, 30, 'fr', '?', 'middle', 800), pop(prog(k, .3, .25), 42, 140)) +
        g(t(104, 132, 24, 'fr', '?', 'middle', 800), pop(prog(k, .55, .25), 104, 124)) +
        g(t(146, 218, 28, 'fr', '?', 'middle', 800), pop(prog(k, .8, .25), 146, 208));
    },

    tiles: () => {
      const L = ['Entry trigger', 'Basket management', 'Recovery logic', 'Structured exit', 'Repeat the cycle', 'Scheduled pause'];
      return L.map((lab, i) => {
        const y = 100 + i * 26;
        return g(r(22, y, 136, 21, 4, i === 4 ? 'fc5' : 'fc', 'stroke-width="0.9"') + r(27, y + 4, 13, 13, 3, 'fl') +
          t(33.5, y + 12.8, 6, 'ft', '0' + (i + 1), 'middle') + t(46, y + 13.4, 7, 'ft', lab, 'start', 600));
      }).join('');
    },

    entry: k =>
      tag(14, 100, '01') +
      p('M12 214 C40 204 55 226 80 208 S118 182 168 190', 'sg', `stroke-width="2.2" ${draw(pe(k, .1, 1.3))}`) +
      g(p('M92 170 h-6 v32 h6', 'sr', 'stroke-width="1.6"') + p('M116 170 h6 v32 h-6', 'sr', 'stroke-width="1.6"') + t(104, 165, 5.5, 'fm', 'STRUCTURE', 'middle', 600), op(prog(k, 1.2, .3))) +
      g(r(130, 166, 30, 12, 3, 'fr') + t(145, 174.5, 6, 'ft', 'POS 1', 'middle'), `${op(prog(k, 2.0, .2))} transform="translate(0 ${(-22 * (1 - pe(k, 2.0, .45))).toFixed(2)})"`),

    basket: k => {
      const chips = [[42, 116], [72, 104], [106, 110], [138, 122], [150, 148]];
      const slots = [[60, 196], [80, 196], [100, 196], [70, 206], [90, 206]];
      const m = pe(k, 1.2, 1.0);
      return tag(14, 100, '02') +
        g(r(52, 188, 76, 40, 8, 'fbask', 'stroke-width="1.2"') + t(90, 223, 6, 'ft', 'ONE BASKET', 'middle'), op(prog(k, .5, .3))) +
        chips.map(([x, y], i) => {
          const [sx, sy] = slots[i];
          const w = lerp(20, 18, m), h = lerp(8, 7, m);
          return g(r(lerp(x, sx, m), lerp(y, sy, m), w, h, 2, 'fg'), op(prog(k, .15 * i, .25)));
        }).join('') +
        g(t(40, 244, 5.5, 'fm', 'TOTAL EXPOSURE', 'start', 600) + r(40, 248, 100, 6, 3, 'fl') + r(40, 248, 62 * pe(k, 2.4, .8), 6, 3, 'fr'), op(prog(k, 2.2, .3)));
    },

    recovery: k => {
      const alarm = k > 1.8 && k < 2.8 ? (Math.floor(k * 8) % 2 ? 1 : .35) : (k >= 2.8 ? .5 : 0);
      return tag(14, 100, '03') +
        p('M12 128 C40 136 62 156 84 176 S124 212 168 222', 'st', `stroke-width="1.8" opacity=".8" ${draw(pe(k, .1, 1.3))}`) +
        g(r(14, 222, 52, 24, 6, 'fbask', 'stroke-width="1"') + t(40, 237, 6, 'ft', 'BASKET', 'middle'), op(prog(k, .2, .3))) +
        g(card(96, 108, 72, 62) + t(103, 121, 6, 'fm', 'PLAN', 'start', 700), op(prog(k, 1.0, .3))) +
        p('M104 160 C114 136 128 158 142 140 S156 128 160 126', 'sr', `stroke-width="1.6" ${draw(pe(k, 1.4, 1.0))}`) +
        g(c(160, 126, 2.6, 'fr') + c(104, 160, 2.6, 'ft'), op(prog(k, 1.4, .3))) +
        g(c(138, 200, 13, 'fl') + t(138, 205, 14, 'fo', '!', 'middle', 800) + t(138, 226, 5.5, 'fm', 'PANIC', 'middle', 700), `opacity="${alarm}"`) +
        ln(124, 214, 152, 186, 'sr', `stroke-width="2.6" ${draw(pe(k, 2.8, .25))}`);
    },

    exit: k => {
      const touch = pe(k, .1, 1.6);
      const closed = prog(k, 1.8, .4);
      return tag(14, 100, '04') +
        g(ln(12, 134, 168, 134, 'sg', 'stroke-width="1.2" stroke-dasharray="4 3"') + t(14, 129, 5.5, 'fgd', 'BASKET TP', 'start', 700), op(prog(k, 0, .3))) +
        p('M12 236 C50 226 72 206 96 186 S140 146 160 134', 'st', `stroke-width="1.8" ${draw(touch)}`) +
        g(c(160, 134, 4 + 8 * prog(k, 1.7, .5), 'fring') + c(160, 134, 3, 'fr'), op(prog(k, 1.7, .15))) +
        g(r(98, 206, 18, 7, 2, 'fg') + r(118, 206, 18, 7, 2, 'fg') + r(108, 216, 18, 7, 2, 'fg'), `opacity="${(1 - closed * .75).toFixed(3)}"`) +
        g(t(118, 238, 6, 'ft', 'ALL CLOSE TOGETHER', 'middle'), op(prog(k, 2.0, .3)));
    },

    loop: k => {
      const rot = 360 * pe(k, .3, 1.4);
      return g(candles(12, 20, 160, 120, 230, 11), `opacity="${(.3 * (1 - pe(k, .2, 1.2)) + .08).toFixed(3)}"`) +
        g(p('M120 132 A44 44 0 1 1 62 140', 'sr', 'stroke-width="7" stroke-linecap="round" marker-end="url(#ah)"'), `transform="rotate(${rot.toFixed(1)} 92 170)"`) +
        t(92, 178, 22, 'ft', '05', 'middle', 800) + g(t(90, 240, 6, 'fm', 'RESET · WAIT · REPEAT', 'middle', 600), op(prog(k, 1.2, .3)));
    },

    pause: k => {
      const ang = -90 + 300 * pe(k, .2, 1.4);
      const hx = 100 + 16 * Math.cos(ang * Math.PI / 180), hy = 152 + 16 * Math.sin(ang * Math.PI / 180);
      return g(r(14, 104, 46, 22, 6, 'fbask', 'stroke-width="1"') + t(37, 118, 5.5, 'ft', 'BASKET', 'middle')) +
        g(c(100, 152, 30, 'fc', 'stroke-width="1"') + c(100, 152, 30, 'sl', 'stroke-width="1.5"') +
          ln(100, 152, 100, 132, 'st', 'stroke-width="2.4" stroke-linecap="round"') + ln(100, 152, hx.toFixed(2), hy.toFixed(2), 'sr', 'stroke-width="2.4" stroke-linecap="round"') + c(100, 152, 2.4, 'ft')) +
        g(r(18, 200, 144, 8, 4, 'fl') + r(104, 200, 32, 8, 0, 'fr', op(.75 * prog(k, 1.2, .3))) +
          t(120, 218, 5.5, 'fm', 'ROLLOVER', 'middle', 700) + t(20, 218, 5.5, 'fm', '00:00', 'start', 500) + t(160, 218, 5.5, 'fm', '24:00', 'end', 500)) +
        g(r(32, 228, 116, 18, 9, 'fbadge', 'stroke-width="1"') + t(90, 240, 6.6, 'ft', 'NEW ENTRIES PAUSED', 'middle', 800),
          `${op(prog(k, 1.6, .25))} transform="translate(${(-40 * (1 - pe(k, 1.6, .4))).toFixed(2)} 0)"`);
    },

    grid4: k => {
      const cells = [[18, 100, 'LOT CAP'], [94, 100, 'EQUITY GUARD'], [18, 178, 'SPREAD FILTER'], [94, 178, 'DAILY TARGET']];
      return cells.map(([x, y, lab], i) => {
        const cx = x + 34, cy = y + 30;
        let icon = '';
        if (i === 0) icon = r(cx - 12, cy + 2, 6, 10, 1, 'fl') + r(cx - 3, cy - 4, 6, 16, 1, 'fl') + r(cx + 6, cy - 8, 6, 20, 1, 'fl') + ln(cx - 15, cy - 12, cx + 15, cy - 12, 'sr', 'stroke-width="2"');
        if (i === 1) icon = p(shield(cx, cy), 'sr', 'stroke-width="2"');
        if (i === 2) icon = p(`M${cx - 13} ${cy - 11} H${cx + 13} L${cx + 3} ${cy + 1} V${cy + 12} L${cx - 3} ${cy + 9} V${cy + 1} Z`, 'sr', 'stroke-width="2" stroke-linejoin="round"');
        if (i === 3) icon = c(cx, cy, 13, 'sr', 'stroke-width="2"') + c(cx, cy, 8, 'sr', 'stroke-width="2"') + c(cx, cy, 3, 'fr');
        return g(card(x, y, 68, 70) + icon + t(cx, y + 60, 6, 'ft', lab, 'middle', 700), pop(prog(k, .25 + i * .55, .3), x + 34, y + 35));
      }).join('');
    },

    cta: k => {
      const tap = prog(k, 1.6, .5);
      const press = k > 1.6 && k < 1.9;
      return g(
        r(34, 86, 112, 160, 12, 'fphone', 'stroke-width="1.2"') +
        r(42, 98, 70, 10, 5, 'fl') + c(48, 103, 1.8, 'fr') + t(52, 105.2, 4.6, 'ft', 'Automated MT4 and MT5', 'start', 500) +
        t(42, 128, 15, 'ft', 'Goldmap EA', 'start', 800) + t(42, 140, 7.4, 'ft', 'Gold trading on a fixed plan', 'start', 700) +
        r(42, 148, 94, 3, 1.5, 'fl') + r(42, 154, 88, 3, 1.5, 'fl') + r(42, 160, 64, 3, 1.5, 'fl') +
        r(42, 172, 96, 20, 5, press ? 'frd' : 'fr') + t(90, 185, 7, 'ft', 'Get Goldmap EA  →', 'middle', 800) +
        r(42, 198, 96, 18, 5, 'fc', 'stroke-width="0.8"') + t(90, 210, 6.4, 'ft', 'See how it works', 'middle', 600) +
        r(42, 224, 20, 8, 4, 'fl') + r(65, 224, 26, 8, 4, 'fl') + r(94, 224, 30, 8, 4, 'fl'),
        `transform="translate(0 ${(30 * (1 - pe(k, 0, .5))).toFixed(2)})" ${op(prog(k, 0, .3))}`) +
        (k > 1.6 ? c(114, 184, 4 + 14 * tap, 'ftap', `opacity="${(.4 * (1 - tap)).toFixed(3)}"`) + c(114, 184, 4.5, 'ft', `opacity="${(.9 * (1 - prog(k, 2.0, .3))).toFixed(3)}"`) : '') +
        (k > 0.8 && k <= 1.6 ? c(lerp(150, 114, pe(k, .8, .7)), lerp(240, 184, pe(k, .8, .7)), 4.5, 'ft', 'opacity=".9"') : '');
    },

    slider: k => {
      const v = pe(k, .2, 1.2);
      const kx = 24 + 132 * .3 * v;
      return card(14, 112, 152, 92) + t(24, 132, 7.5, 'ft', 'One bad basket costs', 'start', 600) +
        t(156, 132, 10, 'fo', '-' + Math.round(30 * v) + '%', 'end', 800) +
        r(24, 150, 132, 5, 2.5, 'fl') + r(24, 150, Math.max(0.1, kx - 24), 5, 2.5, 'fr') + c(kx, 152.5, 7, 'fknob', 'stroke-width="1.5"') +
        t(24, 176, 5, 'fm', 'Basket and recovery strategies can lose', 'start', 500) + t(24, 184, 5, 'fm', 'a large chunk in one move.', 'start', 500) +
        p(`M${kx + 6} 160 l0 18 l4.5 -4 l3.5 8 l3 -1.5 l-3.4 -7.7 l5.4 -.3 Z`, 'ft', 'stroke="#0A0E1E" stroke-width=".8"');
    },

    inputs: k =>
      card(14, 100, 152, 142) +
      t(24, 116, 6.2, 'ft', 'Starting capital (USD)', 'start', 600) + r(24, 121, 132, 18, 4, 'fin', 'stroke-width=".8"') + t(30, 133.5, 7.5, 'ft', '5000', 'start', 600) +
      t(24, 156, 6.2, 'ft', 'Daily target', 'start', 600) + t(156, 156, 7.5, 'fr', '1.5%', 'end', 800) + r(24, 163, 132, 4, 2, 'fl') + r(24, 163, 38, 4, 2, 'fr') + c(62, 165, 5, 'fknob', 'stroke-width="1.2"') +
      t(24, 192, 6.2, 'ft', 'Trading days per month', 'start', 600) + r(24, 197, 132, 18, 4, 'fin', 'stroke-width=".8"') + t(30, 209.5, 7.5, 'ft', '20', 'start', 600) +
      r(21, 118, 138, 24, 6, 'hl', `stroke-width="1.8" ${op(prog(k, .5, .2))}`) +
      r(21, 147, 138, 26, 6, 'hl', `stroke-width="1.8" ${op(prog(k, 1.4, .2))}`) +
      r(21, 194, 138, 24, 6, 'hl', `stroke-width="1.8" ${op(prog(k, 2.3, .2))}`) +
      g(t(24, 232, 5, 'fm', 'EXAMPLE VALUES FROM THE WEBSITE CALCULATOR', 'start', 600), op(prog(k, 2.6, .3))),

    upside: k => {
      const L = [['1 month', 24, 158], ['3 months', 96, 158], ['6 months', 24, 196], ['12 months', 96, 196]];
      const pulse = 1 + .06 * Math.sin(k * 6);
      return card(14, 104, 152, 124) + t(24, 121, 6.6, 'ft', 'If every single day hit the target', 'start', 700) +
        g(r(24, 128, 84, 13, 6.5, 'fbadgeG', 'stroke-width="1"') + t(66, 137, 5.2, 'fgd', 'TARGET, NOT FORECAST', 'middle', 800), `transform="translate(66 134.5) scale(${pulse.toFixed(3)}) translate(-66 -134.5)"`) +
        L.map(([lab, x, y]) => t(x, y, 5.5, 'fm', lab, 'start', 500) + r(x, y + 5, 50, 12, 3, 'ft', 'filter="url(#blur)" opacity=".75"')).join('') +
        g(t(90, 248, 6, 'fr', 'FIGURES BLURRED ON PURPOSE', 'middle', 800), op(prog(k, 1.0, .3)));
    },

    bignum: k =>
      r(14, 118, 152, 104, 8, 'fredcard', 'stroke-width="1"') +
      p('M28 128 L34 138 H22 Z', 'sp', 'stroke-width="1.2" stroke-linejoin="round"') + t(40, 137, 7, 'ft', 'Now the other side', 'start', 700) +
      t(24, 160, 6, 'fm', 'Balance after one bad basket', 'start', 500) + t(24, 192, 26, 'fpink', money(lerp(5000, 3500, pe(k, .5, 1.2))), 'start', 800) +
      g(t(24, 210, 5.4, 'fm', 'From $5,000, one basket at -30%', 'start', 500), op(prog(k, 1.6, .3))),

    hill: k =>
      r(14, 106, 152, 82, 8, 'fredcard', 'stroke-width="1"') +
      t(24, 126, 6, 'fm', 'Gain needed just to break even', 'start', 500) + t(24, 160, 26, 'ft', '+' + (42.9 * pe(k, .4, 1.2)).toFixed(1) + '%', 'start', 800) +
      t(156, 180, 9, 'fm', 'not 30%', 'end', 700) + ln(120, 177, 157, 173, 'sr', `stroke-width="2" ${draw(pe(k, 1.9, .3))}`) +
      p('M22 252 L60 242 L96 224 L150 198', 'sr', `stroke-width="3" stroke-linecap="round" fill="none" ${draw(pe(k, .3, 1.4))}`) +
      g(p('M150 198 l-9 1 l5 7 Z', 'fr'), op(prog(k, 1.6, .2))) +
      ln(22, 254, 160, 254, 'sl', 'stroke-width="1"'),

    calendar: k => {
      const filled = Math.floor(24 * prog(k, .3, 2.5));
      let out = '';
      for (let i = 0; i < 30; i++) {
        const x = 26 + (i % 6) * 22, y = 106 + Math.floor(i / 6) * 22;
        out += r(x, y, 18, 18, 3, i < filled ? 'fr' : 'fl', i < filled ? `opacity="${(.55 + (i / 24) * .45).toFixed(2)}"` : '');
      }
      return out + t(90, 236, 8, 'ft', (filled || 0) + ' winning days', 'middle', 800) + g(t(90, 247, 5.5, 'fm', 'AT A 1.5% DAILY TARGET', 'middle', 600), op(prog(k, 2.8, .3)));
    },

    shields2: k =>
      g(card(14, 104, 152, 140), 'opacity=".16"') +
      g(p(shield(56, 166, 2.1), 'fshield', 'stroke-width="2.4" stroke-linejoin="round"') + t(56, 172, 7, 'ft', 'LOT', 'middle', 800) + t(56, 180, 7, 'ft', 'CAP', 'middle', 800), pop(prog(k, .2, .35), 56, 166)) +
      g(p(shield(124, 166, 2.1), 'fshield', 'stroke-width="2.4" stroke-linejoin="round"') + t(124, 172, 7, 'ft', 'EQUITY', 'middle', 800) + t(124, 180, 7, 'ft', 'GUARD', 'middle', 800), pop(prog(k, .7, .35), 124, 166)) +
      g(t(90, 230, 5.8, 'fm', 'BUILT INTO THE SETTINGS', 'middle', 700), op(prog(k, 1.3, .3))),

    slam: () => '',

    xcards: k => {
      const L = ['Profit screenshot', 'Testimonial', 'Member count'];
      return L.map((lab, i) => {
        const y = 102 + i * 50, a = .1 + i * .7;
        let inner = '';
        if (i === 0) inner = r(44, y + 22, 8, 10, 1, 'fm') + r(56, y + 16, 8, 16, 1, 'fm') + r(68, y + 10, 8, 22, 1, 'fm');
        if (i === 1) inner = t(48, y + 34, 20, 'fm', '“', 'start', 800) + r(62, y + 20, 60, 3, 1.5, 'fl') + r(62, y + 27, 48, 3, 1.5, 'fl');
        if (i === 2) inner = t(46, y + 32, 13, 'fm', '#,###', 'start', 800);
        const xs = prog(k, a + .3, .12), sc = lerp(1.6, 1, xs);
        return g(card(30, y, 120, 42) + t(134, y + 10, 5, 'fm', lab.toUpperCase(), 'end', 700) + inner, `${op(prog(k, a, .2))} transform="translate(${(60 * (1 - pe(k, a, .3))).toFixed(2)} 0)"`) +
          g(ln(36, y + 4, 144, y + 38, 'sr', 'stroke-width="3" stroke-linecap="round"') + ln(144, y + 4, 36, y + 38, 'sr', 'stroke-width="3" stroke-linecap="round"'),
            `${op(xs)} transform="translate(90 ${y + 21}) scale(${sc.toFixed(3)}) translate(-90 ${-(y + 21)})"`);
      }).join('');
    },

    highlight: k =>
      r(18, 112, 130, 4, 2, 'fl') + r(18, 122, 140, 4, 2, 'fl') + r(18, 132, 100, 4, 2, 'fl') +
      r(16, 146, Math.max(0.1, 150 * pe(k, .6, .5)), 34, 3, 'fmark') +
      t(22, 160, 6.4, 'ft', 'No performance chart here on purpose.', 'start', 700) +
      t(22, 171, 5.2, 'ft', 'Results depend on your settings, your broker', 'start', 500) +
      r(18, 194, 140, 4, 2, 'fl') + r(18, 204, 120, 4, 2, 'fl') + r(18, 214, 132, 4, 2, 'fl') + r(18, 224, 80, 4, 2, 'fl'),

    table: k => {
      const rows = [['Instrument', 'XAUUSD (gold)'], ['Platforms', 'MT4 and MT5'], ['Order handling', 'Basket'], ['Risk controls', 'Lot cap · guard · spread'], ['Entry pause', 'Rollover hours']];
      const hi = Math.min(4, Math.floor(Math.max(0, k - .5) / 1.05));
      return card(12, 100, 156, 154) + t(22, 116, 6.6, 'ft', 'What you are actually running', 'start', 700) +
        rows.map(([a, b], i) => {
          const y = 124 + i * 26;
          return (k > .5 && i === hi ? r(13, y, 154, 26, 0, 'frow') : '') + ln(12, y, 168, y, 'sl', 'stroke-width=".7"') +
            t(22, y + 16, 5.8, 'fm', a, 'start', 500) + t(158, y + 16, 5.8, 'ft', b, 'end', 700);
        }).join('');
    },

    laptop: k => {
      const b1 = Math.sin(k * 22) > 0 ? -1.5 : 0, b2 = Math.sin(k * 22 + 1.7) > 0 ? -1.5 : 0;
      return g(r(36, 112, 108, 72, 4, 'fc', 'stroke-width="1.2"') +
        `<g filter="url(#blur)" opacity=".7">${candles(10, 42, 138, 120, 176, 5)}</g>` +
        p('M26 186 H154 L166 198 H14 Z', 'fl')) +
        g(r(44, 190 + (k < 2 ? b1 : 0), 32, 13, 6, 'fhand') + r(104, 190 + (k < 2 ? b2 : 0), 32, 13, 6, 'fhand')) +
        g(r(80, 226, 20, 16, 3, 'fr') + p('M84 226 v-5 a6 6 0 0 1 12 0 v5', 'sr', 'stroke-width="2.2"') + c(90, 233, 1.8, 'fbgc') +
          t(90, 256, 6, 'ft', 'YOUR OWN BROKER ACCOUNT', 'middle', 800), pop(prog(k, 2.0, .35), 90, 236));
    },

    phone: k => {
      const scroll = -10 * pe(k, 2.0, 2.0);
      return r(44, 94, 92, 168, 10, 'fphone', 'stroke-width="1.2"') +
        `<g clip-path="url(#phoneclip)"><g transform="translate(0 ${scroll.toFixed(2)})">` +
        [['UPDATE', 122], ['SETTING CHANGE', 160], ['USER POST', 198], ['UPDATE', 236]].map(([lab, y], i) =>
          g(r(52, y, 74, 30, 5, 'fc', 'stroke-width=".7"') + t(57, y + 9, 4.8, 'fr', lab, 'start', 800) + r(57, y + 14, 60, 3, 1.5, 'fl') + r(57, y + 20, 44, 3, 1.5, 'fl'), op(prog(k, .2 + i * .45, .25)))).join('') +
        `</g></g>` +
        r(44, 94, 92, 20, 0, 'fl') + p('M52 106 L64 101 L60 111 L58 107 Z', 'ft') + t(68, 107.5, 6, 'ft', 'Goldmap EA channel', 'start', 700) +
        p('M118 246 C118 232 128 228 136 232 L150 240 C156 244 156 258 148 262 L124 262 C118 258 118 252 118 246 Z', 'fhand', `transform="translate(0 ${(scroll * .6).toFixed(2)})"`);
    }
  };

  // Which scenes use the generic stagger on their top-level groups
  const STAGGER = { tiles: .14 };

  const VIDEOS = [
    {
      id: 'v1', file: 'goldmap-ea-v1-one-repeating-cycle', title: 'One Repeating Cycle, No Fortune Telling',
      scenes: [
        { art: 'glitch', min: 3, ost: ['Guessing gold every day?'], vo: 'Still trying to guess where gold goes next?', sfx: 'hit' },
        { art: 'tiles', min: 4, ost: ['Goldmap EA runs ONE fixed cycle'], vo: 'Goldmap EA doesn’t predict. It runs the same six-step cycle on gold, inside your own MetaTrader.' },
        { art: 'entry', min: 5, ost: ['01 · Entry trigger'], vo: 'One: it waits for its own structure condition on gold, then places the first position by itself.' },
        { art: 'basket', min: 5, ost: ['02 · Basket management', 'One basket, not 10 lonely trades'], vo: 'Two: every open position goes into one basket. It watches total exposure, not one trade at a time.' },
        { art: 'recovery', min: 5, ost: ['03 · Recovery logic'], vo: 'Three: if price goes against the basket, built-in recovery rules adjust the plan instead of panicking.' },
        { art: 'exit', min: 5, ost: ['04 · Structured exit', 'TP calculated for the whole basket'], vo: 'Four: take profit is calculated for the whole basket. Once it’s reached, everything closes together.' },
        { art: 'loop', min: 4, ost: ['05 · Repeat the cycle'], vo: 'Five: reset, wait for the next valid condition. Same routine, day after day.' },
        { art: 'pause', min: 5, ost: ['06 · Scheduled pause'], vo: 'Six: around rollover and thin-liquidity hours, new entries pause.' },
        { art: 'grid4', min: 4, ost: ['Built-in risk controls'], vo: 'Plus a lot cap, equity guard, spread filter, and an optional daily target that stops new cycles.' },
        { art: 'cta', min: 5, cta: true, hold: 1.8, ost: ['Get Goldmap EA', 'goldmapea.com'], vo: 'Want to see it for yourself? Tap Get Goldmap EA at goldmapea.com.', sfx: 'tap' }
      ]
    },
    {
      id: 'v2', file: 'goldmap-ea-v2-count-both-sides', title: 'Count Both Sides',
      scenes: [
        { art: 'slider', min: 3, ost: ['One bad basket = -30%.', 'Now what?'], vo: 'Everyone shows you the upside. Let’s do the other side.', sfx: 'hit' },
        { art: 'inputs', min: 5, ost: ['Example: $5,000 · 1.5% · 20 days'], vo: 'Goldmap EA lets you set a daily profit target. Say 1.5 percent, on a five-thousand-dollar account.' },
        { art: 'upside', min: 5, ost: ['Assumes 20 winning days out of 20.', 'That doesn’t happen.'], vo: 'The upside panel assumes you win every single day. The website itself says that doesn’t happen in real trading, so we’re skipping it.' },
        { art: 'bignum', min: 6, ost: ['After one bad basket: $3,500'], vo: 'Now the other side. One bad basket costing thirty percent leaves five thousand at thirty-five hundred.' },
        { art: 'hill', min: 5, ost: ['To break even: +42.9%'], vo: 'To get back to even, you now need plus forty-two point nine percent. Not thirty.' },
        { art: 'calendar', min: 5, ost: ['≈ 24 winning days', 'just to climb back'], vo: 'At a 1.5 percent target, that’s roughly 24 winning days just to climb back.' },
        { art: 'shields2', min: 6, ost: ['Lot cap + equity guard', 'matter more than the target.'], vo: 'That’s why the lot cap and equity guard in the settings matter more than the target itself.' },
        { art: 'cta', min: 5, cta: true, hold: 1.8, ost: ['Run the numbers yourself.', 'Get Goldmap EA · goldmapea.com'], vo: 'Try the calculator yourself, then tap Get Goldmap EA at goldmapea.com. Only run money you can genuinely afford to lose.', sfx: 'tap' }
      ]
    },
    {
      id: 'v3', file: 'goldmap-ea-v3-zero-profit-screenshots', title: 'Zero Profit Screenshots. On Purpose.',
      scenes: [
        { art: 'slam', min: 3, mid: true, slam: true, nologo: true, ost: ['This gold EA has <span class="r">ZERO</span> profit screenshots.', 'On purpose.'], vo: 'This gold EA has zero profit screenshots. On purpose.', sfx: 'slam' },
        { art: 'xcards', min: 4, ost: ['No screenshots. No testimonials.', 'No member counts.'], vo: 'No profit screenshots. No testimonials. No member counts.' },
        { art: 'highlight', min: 5, ost: ['Results depend on your settings, your broker and the market.'], vo: 'Why? Because results depend on your settings, your broker and the market.' },
        { art: 'table', min: 7, ost: ['So you get the mechanics instead.'], vo: 'So instead, you get the mechanics: gold only, MT4 and MT5, basket order handling, lot cap, equity guard, spread filter, and a pause around rollover.' },
        { art: 'laptop', min: 5, ost: ['Your terminal or VPS.', 'Your funds stay in your own broker account.'], vo: 'It runs on your own terminal or VPS, and your funds stay in your own broker account.' },
        { art: 'phone', min: 6, ost: ['Check the Telegram channel yourself.', 'Good days and bad days.'], vo: 'Want proof? Check our Telegram channel. Updates, setting changes, and whatever users post themselves. Good days and bad days.' },
        { art: 'cta', min: 5, cta: true, hold: 1.8, ost: ['Check it yourself before you decide.', 'Get Goldmap EA · goldmapea.com'], vo: 'Check it yourself before you decide. Then tap Get Goldmap EA at goldmapea.com.', sfx: 'tap' }
      ]
    }
  ];

  const api = { A, VIDEOS, STAGGER, clamp, prog, ease, pe, lerp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GM = api;
})(this);
