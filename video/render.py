"""Step 4: render build/plan.json to out/alvique_tiktok_ad.mp4 (1080x1920, 30fps).

Frames are composed with Pillow and piped straight into FFmpeg (libx264).
Audio = cleaned VO + synthesised whoosh/pop SFX (+ optional music bed from
assets/music/, ducked under the VO), normalised to -14 LUFS.

  python render.py              full render
  python render.py --stills     contact sheet of every shot (crop check)
  python render.py --frames 0.5,3.2,...   single frames to build/frames/
"""
import argparse
import math
import random
import subprocess
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

from common import ASSETS, BUILD, FONT_ANTON, OUT, ffmpeg, load_json, loudnorm, \
    measure_lufs, read_audio, write_audio
from config import (BEATS, CTA, FPS, H, HEADLINE_SIZE, HEADLINE_XY, LABEL_XY,
                    MUSIC_LUFS, NAVY, OUTLINE, SAFE_RIGHT, SHOTS, SOURCES, SR, SUB_SIZE,
                    SUB_Y, SUB_Y_CTA, VO_LUFS, W, WHITE, YELLOW, PRODUCT_SQUARE)

COLORS = dict(yellow=YELLOW, white=WHITE)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_in_out(u):
    return 0.5 - 0.5 * math.cos(math.pi * clamp(u))


def ease_out_back(u, s=1.8):
    u = clamp(u) - 1
    return 1 + (s + 1) * u ** 3 + s * u ** 2


def pop(t, dur=0.42):
    """0 -> overshoot (~1.17) -> settle at 1: the bounce for text pop-ins."""
    if t <= 0:
        return 0.0
    u = t / dur
    if u >= 1:
        return 1.0
    return 1 - math.exp(-5 * u) * math.cos(9 * u)


# ---------------------------------------------------------------- sources
@lru_cache(None)
def source(name):
    rel, kind = SOURCES[name]
    im = ImageOps.exif_transpose(Image.open(ASSETS / rel)).convert("RGB")
    if kind == "product":
        im = im.crop(PRODUCT_SQUARE)
    return im


@lru_cache(None)
def font(size):
    return ImageFont.truetype(str(FONT_ANTON), size)


def view_affine(img, cx, cy, w, rot=0.0, dx=0.0, dy=0.0):
    iw, ih = img.size
    w = min(w, iw, ih * 9 / 16)
    h = w * 16 / 9
    cx = clamp(cx, w / 2, iw - w / 2)
    cy = clamp(cy, h / 2, ih - h / 2)
    s = w / W
    c, sn = math.cos(rot), math.sin(rot)
    a, b, d, e = s * c, -s * sn, s * sn, s * c
    ox, oy = W / 2 - dx, H / 2 - dy
    return (a, b, cx - a * ox - b * oy, d, e, cy - d * ox - e * oy)


def render_view(img, view, rot=0.0, dx=0.0, dy=0.0):
    data = view_affine(img, *view, rot=rot, dx=dx, dy=dy)
    return img.transform((W, H), Image.AFFINE, data, resample=Image.BICUBIC)


def lerp(a, b, u):
    return tuple(x + (y - x) * u for x, y in zip(a, b))


# ---------------------------------------------------------------- shots
class Shot:
    def __init__(self, entry, seed):
        self.e = entry
        self.spec = dict(SHOTS[entry["shot"]])
        self.t0, self.t1 = entry["start"], entry["end"]
        self.img = source(self.spec["src"])
        self.rng = random.Random(seed)
        self.phase = [self.rng.uniform(0, 6.28) for _ in range(3)]
        if self.spec["mode"] == "fill" and entry.get("reverse"):
            self.spec["v0"], self.spec["v1"] = self.spec["v1"], self.spec["v0"]
        if self.spec["mode"] == "card":
            self._prepare_card()

    # progress through the shot's move, by motion type
    def progress(self, t):
        dur = max(self.t1 - self.t0, 1e-3)
        lt = t - self.t0
        m = self.spec.get("motion", "ease")
        if m == "punch":   # most of the zoom lands in ~0.25s, then creeps on
            return 0.8 * (1 - math.exp(-lt / 0.08)) + 0.2 * clamp(lt / dur)
        if m == "kick":    # cut lands slightly tight and settles, then drifts
            return clamp(lt / dur)
        return ease_in_out(lt / dur)

    def kick(self, t):
        if self.spec.get("motion") != "kick":
            return 1.0
        return 1 - 0.07 * math.exp(-(t - self.t0) / 0.07)

    def shake(self, t):
        amt = self.spec.get("shake", 0)
        if not amt:
            return 0, 0, 0
        lt = t - self.t0
        env = amt * (0.35 + 0.65 * math.exp(-lt / 0.35))
        p = self.phase
        dx = env * 16 * (math.sin(lt * 37 + p[0]) + 0.5 * math.sin(lt * 71 + p[1]))
        dy = env * 14 * (math.sin(lt * 43 + p[1]) + 0.5 * math.sin(lt * 89 + p[2]))
        rot = env * 0.012 * math.sin(lt * 29 + p[2])
        return dx, dy, rot

    def frame(self, t):
        if self.spec["mode"] == "card":
            return self._card_frame(t)
        u = self.progress(t)
        cx, cy, w = lerp(self.spec["v0"], self.spec["v1"], u)
        w *= self.kick(t)
        dx, dy, rot = self.shake(t)
        if dx or dy:
            w *= 0.94  # margin so shake never reveals an edge
        im = render_view(self.img, (cx, cy, w), rot, dx, dy)
        scale = W / w
        if scale > 1.25:
            im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=55, threshold=2))
        return im

    # card: sharp rounded inset on a blurred, darkened bed of the same photo
    def _prepare_card(self):
        x0, y0, x1, y1 = self.spec["rect"]
        rw, rh = x1 - x0, y1 - y0
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        bed = render_view(self.img, (cx, cy, max(rw, rh * 9 / 16) * 1.9))
        bed = bed.filter(ImageFilter.GaussianBlur(34))
        bed = Image.blend(bed, Image.new("RGB", bed.size, NAVY), 0.35)
        self.bed = bed
        max_w, max_h = 900, 860
        k = min(max_w / rw, max_h / rh)
        self.cw, self.ch = int(rw * k), int(rh * k)
        self.ccenter = (W // 2 - 30, 830 if rw >= rh else 945)
        r = 44
        mask = Image.new("L", (self.cw, self.ch), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, self.cw - 1, self.ch - 1), r, fill=255)
        self.mask = mask
        b = 10
        frame = Image.new("RGBA", (self.cw + 2 * b, self.ch + 2 * b), (0, 0, 0, 0))
        ImageDraw.Draw(frame).rounded_rectangle((0, 0, frame.width - 1, frame.height - 1),
                                                r + b, fill=WHITE + (255,))
        self.border = frame
        pad = 60
        sh = Image.new("RGBA", (frame.width + 2 * pad, frame.height + 2 * pad), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 18, pad + frame.width,
                                              pad + frame.height + 18), r + b,
                                             fill=(0, 0, 0, 150))
        self.shadow = sh.filter(ImageFilter.GaussianBlur(24))
        self.pad = pad

    def _card_frame(self, t):
        x0, y0, x1, y1 = self.spec["rect"]
        lt = t - self.t0
        u = clamp(lt / max(self.t1 - self.t0, 1e-3))
        z = 0.02 + 0.10 * u if not self.e.get("reverse") else 0.12 - 0.10 * u
        rw, rh = (x1 - x0) * (1 - z), (y1 - y0) * (1 - z)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        box = (cx - rw / 2, cy - rh / 2, cx + rw / 2, cy + rh / 2)
        card = self.img.resize((self.cw, self.ch), Image.LANCZOS, box=box)
        card = card.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        layer = self.border.copy()
        layer.paste(card, (10, 10), self.mask)
        s = 0.86 + 0.14 * ease_out_back(lt / 0.24)
        frame = self.bed.copy()
        sh = self.shadow
        if abs(s - 1) > 1e-3:
            layer = layer.resize((max(1, int(layer.width * s)), max(1, int(layer.height * s))),
                                 Image.BICUBIC)
            sh = sh.resize((max(1, int(sh.width * s)), max(1, int(sh.height * s))),
                           Image.BICUBIC)
        ccx, ccy = self.ccenter
        frame.paste(sh, (int(ccx - sh.width / 2), int(ccy - sh.height / 2)), sh)
        frame.paste(layer, (int(ccx - layer.width / 2), int(ccy - layer.height / 2)), layer)
        return frame


# ---------------------------------------------------------------- text
def headline_strip(text, color, size=HEADLINE_SIZE, max_w=SAFE_RIGHT - HEADLINE_XY[0]):
    f = font(size)
    l, t, r, b = f.getbbox(text)
    while r - l > max_w - 64 and size > 60:
        size -= 4
        f = font(size)
        l, t, r, b = f.getbbox(text)
    px, py = 30, 16
    w, h = r - l + 2 * px, b - t + 2 * py
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 16, fill=NAVY + (255,))
    d.text((px - l, py - t), text, font=f, fill=COLORS[color])
    return im


def place_scaled(canvas, im, cx, cy, s, rot=0.0):
    if s <= 0.01:
        return
    if abs(s - 1) > 1e-3:
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.BICUBIC)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


class Headlines:
    def __init__(self, plan):
        self.blocks = []   # (t, [strips], top)
        ev = plan["events"]
        for sc, beat in zip(plan["scenes"], BEATS):
            strips = [headline_strip(s, beat["color"]) for s in beat["headline"]]
            t0 = sc["start"] - (0.2 if sc["start"] == 0 else 0)   # hook: visible on frame 0
            self.blocks.append(dict(t=t0, end=sc["end"], strips=strips, top=HEADLINE_XY[1]))
            if beat.get("headline2"):
                top = HEADLINE_XY[1] + sum(s.height + 12 for s in strips) + 6
                s2 = [headline_strip(s, beat["color2"]) for s in beat["headline2"]]
                self.blocks.append(dict(t=ev["berbaloi"], end=sc["end"], strips=s2, top=top,
                                        tilt=-2))

    def draw(self, canvas, t):
        for blk in self.blocks:
            if not (blk["t"] <= t < blk["end"] + 1e-6):
                continue
            y = blk["top"]
            for k, im in enumerate(blk["strips"]):
                s = pop(t - blk["t"] - 0.07 * k)
                cx = HEADLINE_XY[0] + im.width / 2 + (12 if blk.get("tilt") else 0)
                place_scaled(canvas, im, cx, y + im.height / 2, s, blk.get("tilt", 0))
                y += im.height + 12


def word_image(text, size=SUB_SIZE):
    f = font(size)
    stroke = 9
    l, t, r, b = f.getbbox(text, stroke_width=stroke)
    im = Image.new("RGBA", (r - l + 8, b - t + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - l, 4 - t), text, font=f, fill=WHITE,
                            stroke_width=stroke, stroke_fill=OUTLINE)
    return im


class Subtitles:
    MAX_WORDS, MAX_CHARS = 3, 16

    def __init__(self, plan):
        words = plan["words"]
        scene_starts = [s["start"] for s in plan["scenes"]][1:]
        chunks, cur = [], []
        for i, w in enumerate(words):
            txt = w["w"].strip().upper()
            txt = txt.strip(",;:")
            if not txt:
                continue
            cur.append(dict(text=txt, t=w["start"], end=w["end"]))
            nxt = words[i + 1] if i + 1 < len(words) else None
            chars = sum(len(c["text"]) + 1 for c in cur)
            brk = (nxt is None or len(cur) >= self.MAX_WORDS or chars >= self.MAX_CHARS
                   or w["w"].rstrip()[-1:] in ".?!,"
                   or nxt["start"] - w["end"] > 0.25
                   or any(w["end"] <= s <= nxt["start"] + 1e-3 for s in scene_starts)
                   or chars + len(nxt["w"]) > self.MAX_CHARS + 4)
            if brk:
                chunks.append(cur)
                cur = []
        self.chunks = []
        cta_t = plan["events"]["cta_start"]
        for k, c in enumerate(chunks):
            nxt_t = chunks[k + 1][0]["t"] if k + 1 < len(chunks) else plan["duration"]
            imgs = [word_image(x["text"]) for x in c]
            space = 18
            total = sum(i.width for i in imgs) + space * (len(imgs) - 1)
            x = (60 + SAFE_RIGHT) / 2 - total / 2
            pos = []
            for im in imgs:
                pos.append(x + im.width / 2)
                x += im.width + space
            self.chunks.append(dict(t=c[0]["t"], end=min(nxt_t, c[-1]["end"] + 0.45),
                                    words=c, imgs=imgs, pos=pos,
                                    y=SUB_Y_CTA if c[0]["t"] >= cta_t - 1e-3 else SUB_Y))

    def draw(self, canvas, t):
        for ch in self.chunks:
            if ch["t"] <= t < ch["end"]:
                for w, im, x in zip(ch["words"], ch["imgs"], ch["pos"]):
                    if t >= w["t"]:
                        s = 0.7 + 0.3 * ease_out_back((t - w["t"]) / 0.14)
                        place_scaled(canvas, im, x, ch["y"], s)


def label_image(text):
    f = font(58)
    l, t, r, b = f.getbbox(text)
    dot = 56
    px, py = 22, 14
    w = dot + 16 + (r - l) + 2 * px
    h = max(dot, b - t) + 2 * py
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=NAVY + (255,))
    cy = h / 2
    d.ellipse((px - 6, cy - dot / 2, px - 6 + dot, cy + dot / 2), fill=YELLOW)
    c = (px - 6 + dot / 2, cy)
    d.line([(c[0] - 13, c[1] + 1), (c[0] - 3, c[1] + 11), (c[0] + 15, c[1] - 11)],
           fill=NAVY, width=8, joint="curve")
    d.text((px + dot + 10 - l, (h - (b - t)) / 2 - t), text, font=f, fill=WHITE)
    return im


class Labels:
    def __init__(self, plan):
        self.items = [dict(l, img=label_image(l["text"])) for l in plan["labels"]]

    def draw(self, canvas, t):
        for it in self.items:
            if it["t"] <= t < it["end"]:
                im = it["img"]
                s = pop(t - it["t"] - 0.05, 0.36)
                place_scaled(canvas, im, LABEL_XY[0] + im.width / 2,
                             LABEL_XY[1] + im.height / 2, s, 3)


# ---------------------------------------------------------------- CTA
def selfie_circle():
    img = source("senyum")
    cx, cy = CTA["selfie_center"]
    r = CTA["selfie_radius"]
    d = CTA["circle_d"]
    face = img.resize((d, d), Image.LANCZOS, box=(cx - r, cy - r, cx + r, cy + r))
    ring1, ring2 = 12, 7
    D = d + 2 * (ring1 + ring2)
    ss = 3
    big = Image.new("RGBA", (D * ss, D * ss), (0, 0, 0, 0))
    dd = ImageDraw.Draw(big)
    dd.ellipse((0, 0, D * ss - 1, D * ss - 1), fill=NAVY + (255,))
    dd.ellipse((ring2 * ss, ring2 * ss, (D - ring2) * ss - 1, (D - ring2) * ss - 1),
               fill=YELLOW + (255,))
    out = big.resize((D, D), Image.LANCZOS)
    mask = Image.new("L", (d * ss, d * ss), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d * ss - 1, d * ss - 1), fill=255)
    out.paste(face, (ring1 + ring2, ring1 + ring2), mask.resize((d, d), Image.LANCZOS))
    return out


def price_tag():
    f_big, f_small = font(112), font(42)
    text, kicker = CTA["price_text"], CTA["price_kicker"]
    l, t, r, b = f_big.getbbox(text)
    sl, st, sr, sb = f_small.getbbox(kicker)
    hole = 70
    w = hole + (r - l) + 60
    h = (b - t) + (sb - st) + 58
    ss = 2
    im = Image.new("RGBA", ((w + 30) * ss, (h + 30) * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    o = 15 * ss
    # tag body with a notched left end
    pts = [(o + hole * ss * 0.55, o), (o + w * ss, o), (o + w * ss, o + h * ss),
           (o + hole * ss * 0.55, o + h * ss), (o, o + h * ss / 2)]
    d.polygon([(x + 8 * ss, y + 10 * ss) for x, y in pts], fill=(0, 0, 0, 90))
    d.polygon(pts, fill=YELLOW + (255,), outline=NAVY + (255,), width=6 * ss)
    hx, hy, hr = o + hole * ss * 0.55, o + h * ss / 2, 12 * ss
    d.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), fill=NAVY + (255,))
    im = im.resize((w + 30, h + 30), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    x = 15 + hole
    d.text((x - sl, 15 + 22 - st), kicker, font=f_small, fill=NAVY)
    d.text((x - l, 15 + 22 + (sb - st) + 6 - t), text, font=f_big, fill=NAVY)
    return im


def bezier(p0, p1, p2, u):
    a = (1 - u) ** 2
    b = 2 * (1 - u) * u
    c = u ** 2
    return (a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1])


@lru_cache(None)
def arrow_image(reveal_step, steps=10):
    """Curved arrow pointing down-left at the TikTok product basket."""
    ss = 2
    box = (40, 1300, 520, 1560)          # screen region the arrow lives in
    bw, bh = box[2] - box[0], box[3] - box[1]
    im = Image.new("RGBA", (bw * ss, bh * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    p0, p1, p2 = (470, 1320), (440, 1500), (150, 1505)
    u_max = reveal_step / steps
    n = 40
    pts = [bezier(p0, p1, p2, u_max * i / n) for i in range(n + 1)]
    pts = [((x - box[0]) * ss, (y - box[1]) * ss) for x, y in pts]
    for width, col in ((34, NAVY), (20, YELLOW)):
        d.line(pts, fill=col + (255,), width=width * ss, joint="curve")
        r = width * ss / 2
        x, y = pts[0]
        d.ellipse((x - r, y - r, x + r, y + r), fill=col + (255,))
    if reveal_step == steps:
        tip = pts[-1]
        prev = pts[-3]
        ang = math.atan2(tip[1] - prev[1], tip[0] - prev[0])
        L, Wd = 62 * ss, 44 * ss
        for grow, col in ((10 * ss, NAVY), (0, YELLOW)):
            l, wd = L + grow, Wd + grow
            tx, ty = tip[0] + math.cos(ang) * (l * 0.55), tip[1] + math.sin(ang) * (l * 0.55)
            bx, by = tx - math.cos(ang) * l, ty - math.sin(ang) * l
            nx, ny = -math.sin(ang), math.cos(ang)
            d.polygon([(tx, ty), (bx + nx * wd, by + ny * wd), (bx - nx * wd, by - ny * wd)],
                      fill=col + (255,))
    return im.resize((bw, bh), Image.LANCZOS), box


class CtaOverlay:
    def __init__(self, plan):
        self.ev = plan["events"]
        self.circle = selfie_circle()
        self.tag = price_tag()
        self.end = plan["duration"]
        self.label = label_image(CTA["arrow_label"]) if CTA.get("arrow_label") else None

    def draw(self, canvas, t):
        ev = self.ev
        if t < ev["cta_start"]:
            return
        lt = t - ev["cta_start"]
        cx, cy = CTA["circle_xy"]
        s = pop(lt, 0.45)
        place_scaled(canvas, self.circle, cx, cy + 6 * math.sin(lt * 3.2), s)
        if t >= ev["price"]:
            pt = t - ev["price"]
            px, py = CTA["price_xy"]
            rot = 6 + 2.0 * math.sin(pt * 4.0) * math.exp(-pt * 0.6)
            place_scaled(canvas, self.tag, px, py, pop(pt, 0.5), rot)
        if t >= ev["arrow"]:
            at = t - ev["arrow"]
            step = min(10, int(at / 0.03))
            im, box = arrow_image(step)
            bob = 10 * math.sin(max(0, at - 0.3) * 7) if step == 10 else 0
            canvas.alpha_composite(im, (int(box[0] - bob * 0.7), int(box[1] + bob * 0.7)))
            if self.label and step == 10:
                lab = self.label
                place_scaled(canvas, lab, 560 + lab.width / 2 - 40, 1440,
                             pop(at - 0.3, 0.36) * 0.82, 0)


# ---------------------------------------------------------------- frame
class Composer:
    def __init__(self, plan):
        self.plan = plan
        self.shots = [Shot(s, i) for i, s in enumerate(plan["shots"])]
        self.head = Headlines(plan)
        self.subs = Subtitles(plan)
        self.labels = Labels(plan)
        self.cta = CtaOverlay(plan)
        self.reveal_t = [s.t0 for s in self.shots if s.spec.get("reveal")]

    def shot_at(self, t):
        for s in self.shots:
            if s.t0 <= t < s.t1:
                return s
        return self.shots[-1]

    def frame(self, t):
        base = self.shot_at(t).frame(t).convert("RGBA")
        for rt in self.reveal_t:   # white flash on the product reveal
            if 0 <= t - rt < 0.17:
                a = int(200 * (1 - (t - rt) / 0.17))
                base.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, a)))
        self.head.draw(base, t)
        self.labels.draw(base, t)
        self.cta.draw(base, t)
        self.subs.draw(base, t)
        return base.convert("RGB")


# ---------------------------------------------------------------- audio
def whoosh(dur=0.5, seed=3):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n).astype(np.float32)
    t = np.linspace(0, 1, n, dtype=np.float32)
    fc = 250 + 5200 * np.sin(np.pi * np.clip(t * 1.1, 0, 1)) ** 2
    alpha = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.zeros(n, np.float32)
    lp = 0.0
    for i in range(n):          # time-varying one-pole low-pass sweep
        lp += alpha[i] * (noise[i] - lp)
        y[i] = lp
    hp = y - np.convolve(y, np.ones(64) / 64, mode="same")
    env = np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 2 * np.exp(-2.5 * np.clip(t - 0.6, 0, 1))
    out = hp * env
    return out / (np.abs(out).max() + 1e-9)


def pop_sfx(dur=0.12, f0=900, f1=260):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.035)
    return (y / np.abs(y).max()).astype(np.float32)


def place(buf, clip, t, gain_db):
    i = int(t * SR)
    if i >= len(buf):
        return
    seg = clip[: len(buf) - i] * (10 ** (gain_db / 20))
    buf[i:i + len(seg)] += seg


def build_audio(plan):
    dur = plan["duration"]
    vo = read_audio(BUILD / "vo_clean.wav")
    n = int(math.ceil(dur * SR))
    vo = np.pad(vo, (0, max(0, n - len(vo))))[:n]
    sfx = np.zeros(n, np.float32)
    w = whoosh()
    for s in plan["shots"]:
        if SHOTS[s["shot"]].get("reveal"):
            place(sfx, w, max(0, s["start"] - 0.22), -17)
        if SHOTS[s["shot"]].get("end_frame"):
            place(sfx, whoosh(0.35, seed=9), max(0, s["start"] - 0.12), -24)
    p = pop_sfx()
    for sc in plan["scenes"]:
        place(sfx, p, sc["start"] + 0.02, -26)
    ev = plan["events"]
    place(sfx, pop_sfx(0.16, 1200, 330), ev["price"] + 0.03, -20)
    place(sfx, p, ev["berbaloi"] + 0.02, -26)
    for lab in plan["labels"]:
        place(sfx, pop_sfx(0.09, 1500, 500), lab["t"] + 0.05, -29)
    write_audio(BUILD / "vo_pad.wav", vo)
    write_audio(BUILD / "sfx.wav", sfx)

    music = sorted(p for p in (ASSETS / "music").glob("*")
                   if p.suffix.lower() in {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"})
    pre = BUILD / "mix_pre.wav"
    if music:
        loudnorm(music[0], BUILD / "music_norm.wav", MUSIC_LUFS)
        fc = ("[2:a]aloop=loop=-1:size=2e9,atrim=0:{d},afade=t=in:d=0.4,"
              "afade=t=out:st={fo}:d=0.8[m];"
              "[0:a]asplit=2[v][key];"
              "[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[md];"
              "[v][1:a][md]amix=inputs=3:normalize=0[out]").format(d=dur, fo=max(0, dur - 0.8))
        ffmpeg("-i", BUILD / "vo_pad.wav", "-i", BUILD / "sfx.wav", "-i", BUILD / "music_norm.wav",
               "-filter_complex", fc, "-map", "[out]", "-t", dur, "-c:a", "pcm_s24le", pre)
    else:
        ffmpeg("-i", BUILD / "vo_pad.wav", "-i", BUILD / "sfx.wav", "-filter_complex",
               "[0:a][1:a]amix=inputs=2:normalize=0[out]", "-map", "[out]",
               "-t", dur, "-c:a", "pcm_s24le", pre)
    loudnorm(pre, BUILD / "mix.wav", VO_LUFS)
    return bool(music)


# ---------------------------------------------------------------- main
def render(plan, out):
    comp = Composer(plan)
    has_music = build_audio(plan)
    n = int(round(plan["duration"] * FPS))
    proc = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-i", str(BUILD / "mix.wav"),
         "-map", "0:v", "-map", "1:a",
         "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
         "-profile:v", "high", "-level", "4.2", "-r", str(FPS),
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-t", f"{n / FPS:.3f}", "-movflags", "+faststart", str(out)],
        stdin=subprocess.PIPE)
    for f in range(n):
        proc.stdin.write(comp.frame(f / FPS).tobytes())
        if f % 60 == 0:
            print(f"  frame {f}/{n}", flush=True)
    proc.stdin.close()
    proc.wait()
    if proc.returncode:
        raise SystemExit("ffmpeg failed")
    lufs, tp = measure_lufs(out)
    print(f"wrote {out} ({n / FPS:.2f}s, {lufs:.1f} LUFS, TP {tp}, music={has_music})")


def stills(plan):
    comp = Composer(plan)
    thumbs = []
    for s in comp.shots:
        for t in (s.t0 + 0.12, s.t1 - 0.02):
            im = comp.frame(t).resize((270, 480), Image.LANCZOS)
            d = ImageDraw.Draw(im)
            d.rectangle((0, 0, 270, 22), fill=(0, 0, 0))
            d.text((4, 4), f"{t:.2f}s {s.e['shot']}", fill=(255, 255, 255))
            thumbs.append(im)
    cols = 8
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * 274, rows * 484), (30, 30, 30))
    for i, im in enumerate(thumbs):
        sheet.paste(im, ((i % cols) * 274, (i // cols) * 484))
    sheet.save(BUILD / "contact_sheet.jpg", quality=88)
    print(BUILD / "contact_sheet.jpg")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", action="store_true")
    ap.add_argument("--frames", default="")
    ap.add_argument("--out", default=OUT / "alvique_tiktok_ad.mp4")
    a = ap.parse_args()
    plan = load_json(BUILD / "plan.json")
    if a.stills:
        return stills(plan)
    if a.frames:
        comp = Composer(plan)
        (BUILD / "frames").mkdir(exist_ok=True)
        for t in map(float, a.frames.split(",")):
            comp.frame(t).save(BUILD / "frames" / f"f_{t:05.2f}.png")
        return
    OUT.mkdir(exist_ok=True)
    render(plan, a.out)


if __name__ == "__main__":
    main()
