import { continueRender, delayRender } from 'remotion';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/jetbrains-mono/800.css';

/** Block rendering until fonts are ready — canvas textures (3D text) need them synchronously. */
let ready = false;
export const fontsReady = (() => {
  if (typeof document === 'undefined') return Promise.resolve();
  const handle = delayRender('Loading fonts');
  const p = Promise.all([
    document.fonts.load("700 40px 'Inter'"),
    document.fonts.load("800 40px 'Inter'"),
    document.fonts.load("900 40px 'Inter'"),
    document.fonts.load("700 40px 'JetBrains Mono'"),
    document.fonts.load("800 40px 'JetBrains Mono'"),
  ]).then(() => {
    ready = true;
    continueRender(handle);
  });
  return p;
})();
export const areFontsReady = () => ready;
