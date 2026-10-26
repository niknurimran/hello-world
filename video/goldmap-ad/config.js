// Goldmap EA — Story/Reels ad v1. Every editable value lives here.
// Text, colours, timing (in beats), chart seeds and audio settings.
// After changing `bpm` or `slots`, run `npm run sync` so index.html and the
// audio clips pick up the new timing, then `npm run audio` to rebuild the beat.
window.GM_CONFIG = {
  fps: 30,
  width: 1080,
  height: 1920,

  // 150 BPM at 30 fps = exactly 12 frames per beat (0.4 s), 1 bar = 1.6 s.
  bpm: 150,

  // Slot boundaries in beats: [startBeat, endBeat]. 90 beats = 36.0 s.
  slots: {
    hook:    [0, 8],    // 0.0 – 3.2 s
    brand:   [8, 16],   // 3.2 – 6.4 s
    problem: [16, 28],  // 6.4 – 11.2 s
    shift:   [28, 38],  // 11.2 – 15.2 s (drop)
    demo:    [38, 56],  // 15.2 – 22.4 s
    how:     [56, 74],  // 22.4 – 29.6 s
    urgency: [74, 82],  // 29.6 – 32.8 s
    cta:     [82, 90],  // 32.8 – 36.0 s
  },

  // Platform UI keep-out (px). Every word stays between top and height - bottom.
  safe: { top: 250, bottom: 350 },

  colors: {
    bg: "#0B0B0F",
    panel: "#14141B",
    panelHi: "#1B1B24",
    line: "#26262F",
    gold: "#D4A73C",
    goldHi: "#F4D27A",
    goldDeep: "#8C6A1E",
    green: "#22C55E",
    red: "#EF4444",
    white: "#FFFFFF",
    mute: "#9A9AA8",
  },

  fonts: {
    display: "Bebas Neue", // headlines
    heavy: "Anton",        // numbers on cards
    body: "Inter",         // small text
  },

  brand: {
    wordmark: "GOLDMAP EA",
    url: "goldmapea.com",
  },

  chart: {
    symbol: "XAUUSD",
    timeframe: "M5",
    label: "Illustration",   // shown on every chart, ~60% opacity
    seeds: { hook: 7, problem: 21, shift: 5, demo: 1337, how: 99 },
  },

  text: {
    hook: {
      lines: ["Stop trading", "on emotions."],
      accent: "emotions.",          // word drawn in red
    },
    brand: {
      tagline: "Fully automated.",
      meta: "XAUUSD · MT4 / MT5",     // storyboard: gold only, MT4 and MT5 builds
    },
    problem: {
      header: "Manual trading:",
      beats: ["Hesitate.", "Panic.", "Repeat."],
    },
    shift: {
      lines: ["Smart traders", "don't click buy", "anymore."],
      accent: "anymore.",
      buyButton: "BUY",
      toggle: "AUTO",
    },
    demo: {
      // Changed from "It reads the market." to match the storyboard
      // ("the EA waits for its own structure condition on gold").
      beats: ["It waits for its setup.", "It executes.", "You live your life."],
      orderBuy: "BUY",
      orderTp: "BASKET TP",
    },
    how: {
      title: "How it works",
      cards: [
        // Storyboard: VPS friendly, runs 24/5; entry trigger waits for its own condition.
        { num: "01", title: "Watches gold 24/5", sub: "On your own MT4 / MT5 or VPS" },
        // Storyboard: auto trade execution, rule-based cycle (entry, basket, exit).
        { num: "02", title: "Executes with set rules", sub: "Entry, basket and exit. One fixed cycle." },
        // Storyboard: built-in risk controls (was "Manages risk automatically").
        { num: "03", title: "Built-in risk controls", sub: "Lot cap · Equity guard · Spread filter" },
      ],
    },
    urgency: {
      lines: ["Limited slots", "this batch."],
      barLabel: "Slots",
    },
    cta: {
      lines: ["Tap 'See details'", "now."],
      // Risk line: shown from the start of this slot to the end of the film
      // (it needs ~6 s on screen to be readable).
      disclaimerFrom: "urgency",
      disclaimer:
        "Trading involves high risk. Past performance does not guarantee future results. " +
        "Trading gold with leverage can lose your entire capital. Not investment advice. No guaranteed returns.",
    },
  },

  audio: {
    music: "assets/audio/generated_hype.wav",
    musicVolume: 1,
    sfxVolume: 0.9,
    seed: 2026,
    riserBars: 1,          // riser length before the drop at slots.shift[0]
    fadeOutSec: 1,         // music fade on the end card
  },
};
