import React from 'react';
import * as THREE from 'three';
import words from '../../data/v03_words.json';
import { SceneDef, VideoEngine } from '../components/VideoEngine';
import { WordsFile } from '../lib/timing';
import { dolly, orbit } from '../lib/camera';
import { backOut, clamp01, dropY, easeInOut, easeOutCubic, lerp, pop, prog, V3 } from '../lib/easing';
import { AbangBlok, KAWAN } from '../objects/AbangBlok';
import { Feather, QMark, Sparkle, Stream, TextCard } from '../objects/Props';
import { AlarmClock, CheckMark } from '../objects/Everyday';
import { Brain, Hand, JackInBox, Shield, Streaks, TouchRing } from '../objects/Brain';
import { GaugePanel } from '../components/Panel';
import { EdgeWarning } from '../components/Flash';

const DATA = words as WordsFile;
export const V03_DURATION = DATA.duration;

const cam = (p0: V3, t0: V3, p1: V3, t1: V3, fov = 35, whip?: number) => dolly({ pos: p0, target: t0, fov }, { pos: p1, target: t1, fov }, { whip });
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const METER: [string, string] = ['TAK GELI', 'GELI'];

/** Speech bubble with text (3D). */
const Bubble3D: React.FC<{ text: string; position: V3; s: number; w?: number }> = ({ text, position, s, w = 2.6 }) => (
  <group position={position} scale={s}>
    <TextCard text={text} bg="#FFFFFF" fg="#16181D" w={w} h={0.7} font={64} depth={0.22} radius={0.1} />
    <mesh position={[-0.6, -0.5, 0]} rotation={[0, 0, 0.5]} castShadow>
      <coneGeometry args={[0.18, 0.4, 4]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
    </mesh>
  </group>
);

/** Brain world position helper: cerebellum point for a brain at `p` with scale `s` and y-rotation `a`. */
const cbWorld = (p: V3, s: number, a = 0): V3 => [p[0] - 0.85 * s * Math.sin(a), p[1] - 0.5 * s, p[2] - 0.85 * s * Math.cos(a)];

const scenes: SceneDef[] = [
  /* 1 */ {
    chip: 'GELETEK DIRI SENDIRI', anchor: [0, 0], env: 'studio',
    cam: cam([0, 2.0, 7.2], [0, 1.4, 0], [0.4, 1.9, 6.2], [0, 1.4, 0], 35, 0),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="tickleSelf" position={[0, dropY(t, -0.2, 0.45, 2), 0]} />
        <Streaks t={t} position={[0.62, 1.15, 0.3]} n={3} color="#FFD23F" />
        <Streaks t={t + 0.3} position={[-0.62, 1.15, 0.3]} n={3} color="#FFD23F" />
      </>
    ),
    tags: [{ text: 'Diri sendiri', color: 'yellow', at: [1.0, 2.3, 0], delay: 0.5 }],
  },
  /* 2 */ {
    chip: 'TAK GELI, KAN?', anchor: [1, 0], env: 'studio',
    cam: cam([0.3, 2.2, 5.0], [0, 1.6, 0], [0, 2.1, 4.3], [0, 1.65, 0]),
    world: ({ t }) => <AbangBlok t={t} pose="bored" />,
    tags: [{ text: 'Tak geli', color: 'black', at: [0.75, 2.5, 0], delay: 0.45 }],
    overlay: ({ t }) => <GaugePanel t={t} from={0} to={0.08} ends={METER} label="METER GELI" />,
  },
  /* 3 */ {
    chip: 'ORANG LAIN BUAT', anchor: [2, 0], env: 'studio',
    cam: cam([0, 2.1, 7.4], [0, 1.4, 0], [0.5, 2.0, 6.6], [0, 1.4, 0]),
    world: ({ t }) => {
      const k = easeInOut(prog(t, 0.2, 1.2));
      return (
        <>
          <AbangBlok t={t} pose="idle" position={[-0.85, 0, 0]} rotation={[0, 0.3, 0]} />
          <AbangBlok t={t} pose="point" side={-1} outfit={KAWAN} position={[0.95, 0, -0.2]} rotation={[0, -0.4, 0]} />
          <Feather position={[lerp(0.6, -0.25, k), 1.25 + Math.sin(t * 12) * 0.05, 0.45]} rotation={[0, 0, 1.2 + Math.sin(t * 14) * 0.3]} scale={0.7} />
        </>
      );
    },
    tags: [{ text: 'Orang lain', color: 'black', at: [0.95, 2.7, -0.2], delay: 0.35 }],
  },
  /* 4 */ {
    chip: 'MENGGELUPUR!', anchor: [2, 5], env: 'studio',
    cam: cam([1.6, 3.4, 6.6], [0, 0.7, 0], [0.8, 3.0, 5.8], [0, 0.7, 0]),
    world: ({ t }) => (
      <>
        <group position={[0.85, 0.34, 0.3]} rotation={[Math.sin(t * 20) * 0.15, 0, Math.PI / 2]}>
          <AbangBlok t={t} pose="laugh" />
        </group>
        <AbangBlok t={t} pose="point" side={-1} outfit={KAWAN} position={[0.2, 0, -1.2]} />
        <Feather position={[-0.35 + Math.sin(t * 16) * 0.15, 0.9, -0.1]} rotation={[0.3, 0, 1.0 + Math.sin(t * 18) * 0.4]} scale={0.7} />
        <Streaks t={t} position={[-0.3, 0.9, 0.8]} color="#FF7EB6" />
      </>
    ),
    tags: [{ text: 'Menggelupur!', color: 'red', at: [0.2, 1.5, 0.3], delay: 0.35, size: 52 }],
    overlay: ({ t }) => <GaugePanel t={t} from={0.1} to={1} at={0.15} dur={0.5} ends={METER} label="METER GELI" />,
  },
  /* 5 */ {
    chip: 'BELAKANG OTAK', anchor: [3, 0], env: 'lab',
    cam: cam([0, 2.2, 7.0], [0, 1.8, 0], [0.4, 2.1, 6.2], [0, 1.8, 0]),
    world: ({ t }) => {
      const a = easeInOut(prog(t, 0.2, 1.6)) * 1.9;
      return (
        <Brain t={t} position={[0, 1.95, 0]} rotation={[0.1, a, 0]} scale={pop(t, 0, 0.4)} cb={easeOutCubic(prog(t, 1.4, 0.6)) * 0.7} cbColor="#FFD23F" />
      );
    },
    tags: [{ text: 'Belakang otak', color: 'yellow', at: (t) => cbWorld([0, 1.95, 0], 1, easeInOut(prog(t, 0.2, 1.6)) * 1.9), dx: 40, dy: 120, delay: 1.5 }],
  },
  /* 6 */ {
    chip: 'SEREBELUM', anchor: [4, 0], env: 'darklab',
    cam: orbit([0, 1.45, -0.7], 4.3, 2.0, 2.3, 2.85, 35),
    world: ({ t }) => (
      <>
        <Brain t={t} position={[0, 1.95, 0]} cb={0.5 + 0.5 * easeOutCubic(prog(t, 0.1, 0.5))} cbColor="#3DDC84" fade={0.55} />
        <pointLight position={[0, 1.4, -2.2]} intensity={10} color="#3DDC84" distance={4} />
      </>
    ),
    tags: [{ text: 'Serebelum', color: 'green', at: [0, 1.45, -0.85], dy: -150, delay: 0.5, size: 54 }],
  },
  /* 7 */ {
    chip: 'GERAK TANGAN', anchor: [5, 0], env: 'studio',
    cam: cam([-1.0, 2.2, 7.0], [0, 1.6, 0], [0, 2.0, 6.2], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="wave" position={[-0.3, 0, 0]} />
        <Streaks t={t} position={[0.55, 2.55, 0.2]} color="#4CC9F0" />
      </>
    ),
    tags: [{ text: 'Gerak tangan', color: 'yellow', at: [0.6, 3.0, 0], delay: 0.35 }],
  },
  /* 8 */ {
    chip: 'RAMAL DULU', anchor: [6, 0], env: 'darklab',
    cam: cam([0, 2.2, 7.0], [0, 1.9, 0], [0.4, 2.1, 6.2], [0, 1.9, 0]),
    world: ({ t }) => {
      const real: V3 = [0.6, lerp(1.1, 1.7, easeInOut(prog(t, 0.6, 1.4))), 0.2];
      const ghost: V3 = [0.6, lerp(1.1, 1.7, easeInOut(prog(t, 0.1, 1.0))), 0.2];
      const brainP: V3 = [-0.8, 3.0, -0.3];
      return (
        <>
          <Brain t={t} position={brainP} scale={0.55} rotation={[0, 0.9, 0]} cb={1} cbColor="#4CC9F0" signals={1} />
          <Hand position={real} rotation={[0, -0.3, 0]} />
          <Hand ghost position={[ghost[0] + 0.05, ghost[1], ghost[2] + 0.05]} rotation={[0, -0.3, 0]} scale={pop(t, 0.05, 0.3)} />
          {t > 0.2 && <Stream path={[v3(...cbWorld(brainP, 0.55, 0.9)), v3(-0.3, 2.6, 0.2), v3(0.3, ghost[1] + 0.6, 0.3), v3(0.6, ghost[1] + 0.3, 0.3)]} t={t} c0="#4CC9F0" c1="#4CC9F0" n={8} size={0.06} speed={0.8} tube={false} />}
        </>
      );
    },
    tags: [{ text: 'Ramalan', color: 'blue', at: [0.6, 2.4, 0.2], dx: 150, delay: 0.5 }],
  },
  /* 9 */ {
    chip: 'APA KAU AKAN RASA', anchor: [6, 4], env: 'neon',
    cam: cam([0.8, 1.8, 5.4], [0, 1.4, 0], [0.2, 1.7, 4.6], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.9, -0.2]} castShadow>
          <boxGeometry args={[2.6, 1.2, 0.6]} />
          <meshStandardMaterial color="#E8B48C" roughness={0.6} />
        </mesh>
        <Hand ghost position={[0.1, 2.15 - easeOutCubic(prog(t, 0, 0.6)) * 0.4, 0.3]} rotation={[-1.2, 0, 0.2]} />
        {[[-0.6, 1.51, 0.0], [0.35, 1.51, -0.15], [0.9, 1.51, 0.05]].map((p, i) =>
          t > 0.5 + i * 0.2 ? <TouchRing key={i} t={t + i * 0.3} position={p as V3} rotation={[-Math.PI / 2, 0, 0]} color="#FF7EB6" /> : null,
        )}
      </>
    ),
    tags: [{ text: 'Apa kau akan rasa', color: 'pink', at: [0, 2.6, 0], delay: 0.45 }],
  },
  /* 10 */ {
    chip: 'RAMALAN TEPAT', anchor: [7, 0], env: 'studio',
    cam: cam([0, 2.0, 6.0], [0, 1.7, 0], [0.4, 2.0, 5.2], [0, 1.7, 0], 35, 0.2),
    world: ({ t }) => {
      const k = easeOutCubic(prog(t, 0, 0.45));
      return (
        <>
          <Hand position={[-0.4, 1.4, 0]} rotation={[0, 0.2, 0]} />
          <Hand ghost position={[-0.4 + (1 - k) * 0.6, 1.4 + (1 - k) * 0.3, 0.02]} rotation={[0, 0.2, 0]} scale={1.03} />
          <CheckMark position={[0.9, 2.2 + dropY(t, 0.45, 0.35, 2), 0.3]} scale={0.6 * pop(t, 0.45, 0.25)} />
        </>
      );
    },
    tags: [{ text: 'Tepat!', color: 'green', at: [0.9, 1.3, 0.3], delay: 0.5, size: 54 }],
  },
  /* 11 */ {
    chip: 'KECILKAN RASA', anchor: [7, 4], env: 'studio',
    cam: cam([-0.6, 2.4, 7.0], [0, 1.7, 0], [0.3, 2.2, 6.2], [0, 1.7, 0]),
    world: ({ t }) => {
      const s = lerp(1, 0.25, easeInOut(prog(t, 0.3, 1.4)));
      return (
        <>
          <AbangBlok t={t} pose="tickleSelf" position={[-0.6, 0, 0]} />
          <mesh position={[0.9, 2.3, 0.2]} scale={0.6 * s * (1 + Math.sin(t * 10) * 0.05)}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshStandardMaterial color="#FF7EB6" emissive="#FF7EB6" emissiveIntensity={0.5 * s} transparent opacity={0.85} />
          </mesh>
        </>
      );
    },
    tags: [{ text: 'Rasa dikecilkan', color: 'blue', at: [0.9, 1.4, 0.2], delay: 0.8 }],
    overlay: ({ t }) => <GaugePanel t={t} from={0.9} to={0.12} at={0.3} dur={1.4} ends={METER} label="METER GELI" />,
  },
  /* 12 */ {
    chip: 'DIA ANGGAP...', anchor: [8, 0], env: 'studio',
    cam: cam([0, 2.3, 7.0], [0, 2.0, 0], [-0.4, 2.2, 6.2], [0, 2.0, 0]),
    world: ({ t }) => (
      <>
        <Brain t={t} position={[-0.3, 1.5, 0]} scale={0.75} rotation={[0, 0.25, 0]} face="calm" />
        <Bubble3D text="“Ni aku sendiri”" position={[0.25, 2.85, 0.4]} s={pop(t, 0.7, 0.35)} w={2.3} />
      </>
    ),
  },
  /* 13 */ {
    chip: 'TAK PAYAH RISAU', anchor: [8, 5], env: 'studio',
    cam: cam([0.6, 2.0, 7.0], [0, 1.5, 0], [0, 1.9, 6.2], [0, 1.5, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="relax" position={[-0.55, 0, 0]} rotation={[0, 0.25, 0]} />
        <Shield position={[0.95, 1.7, 0.3]} scale={0.7 * pop(t, 0.2, 0.35)} rotation={[0, -0.3, Math.sin(t * 3) * 0.05]} />
      </>
    ),
    tags: [{ text: 'Tak payah risau', color: 'green', at: [0.9, 0.6, 0.3], delay: 0.45 }],
  },
  /* 14 */ {
    chip: 'GELI = KEJUTAN', anchor: [9, 0], env: 'studio',
    cam: cam([1.2, 2.4, 7.2], [0, 1.7, 0], [0.2, 2.2, 6.4], [0, 1.7, 0]),
    world: ({ t }) => (
      <JackInBox t={t} open={easeOutCubic(prog(t, 1.4, 0.4)) * 1 + Math.max(0, t - 1.8) * 0} position={[0, 0, 0]} rotation={[0, -0.3 + Math.sin(t * 30) * 0.03 * (t < 1.4 ? 1 : 0), 0]} />
    ),
    tags: [{ text: 'Kejutan!', color: 'yellow', at: [0.9, 3.6, 0], delay: 1.6, size: 54 }],
  },
  /* 15 */ {
    chip: 'ORANG LAIN GELETEK', anchor: [10, 0], env: 'studio',
    cam: cam([-1.2, 2.2, 7.0], [0, 1.4, 0], [-0.6, 2.0, 6.4], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="idle" position={[-0.5, 0, 0.4]} />
        <AbangBlok t={t} pose="point" side={-1} outfit={KAWAN} position={[lerp(1.6, 0.8, easeOutCubic(prog(t, 0, 0.8))), 0, -0.6]} rotation={[0, -0.5, 0]} />
        <Feather position={[lerp(1.0, 0.0, easeOutCubic(prog(t, 0.1, 0.8))), 1.2, 0.2]} rotation={[0, 0, 1.2 + Math.sin(t * 14) * 0.3]} scale={0.6} />
      </>
    ),
    tags: [{ text: 'Geletek!', color: 'red', at: [0.8, 2.7, -0.6], delay: 0.4 }],
  },
  /* 16 */ {
    chip: 'TAK TAHU BILA', anchor: [11, 0], env: 'studio',
    cam: cam([0, 2.2, 7.0], [0, 1.6, 0], [0.4, 2.1, 6.2], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        <Brain t={t} position={[-0.4, 2.0, 0]} scale={0.55} rotation={[0, 0.35, Math.sin(t * 3) * 0.08]} face="confused" />
        <AlarmClock t={t} ring={1} position={[0.85, dropY(t, 0.1, 0.4, 3), 0.2]} rotation={[0, -0.3, 0]} />
        <QMark position={[0.1, 3.1, 0.3]} scale={0.8 * pop(t, 0.4)} />
      </>
    ),
    tags: [{ text: 'Bila?', color: 'yellow', at: [0.85, 2.0, 0.2], dx: 60, delay: 0.5, size: 52 }],
  },
  /* 17 */ {
    chip: 'KAT MANA?', anchor: [11, 4], env: 'studio',
    cam: cam([0, 1.8, 6.2], [0, 1.25, 0], [0, 1.7, 5.4], [0, 1.25, 0]),
    world: ({ t }) => {
      const pts: V3[] = [[0.15, 1.35, 0.2], [-0.16, 0.5, 0.17], [0.45, 1.1, 0.14], [0, 2.18, 0.32], [-0.3, 1.0, 0.2], [0.16, 0.25, 0.2]];
      const step = Math.floor(t / 0.35);
      return (
        <>
          <AbangBlok t={t} pose="shocked" />
          {pts.map((p, i) => ((i + step) % 3 === 0 ? <TouchRing key={i} t={t} position={p} /> : null))}
        </>
      );
    },
    tags: [{ text: 'Kat mana?', color: 'red', at: [-1.0, 2.6, 0], delay: 0.4, size: 52 }],
  },
  /* 18 */ {
    chip: 'SISTEM PENTING', anchor: [12, 0], env: 'darklab',
    cam: orbit([0, 1.8, 0], 6.4, 2.6, -0.5, 0.2, 35),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.5, 0.6, 48]} />
          <meshStandardMaterial color="#3A4150" roughness={0.6} />
        </mesh>
        <Brain t={t} position={[0, 1.9, 0]} scale={0.8} rotation={[0, t * 0.6 + 0.6, 0]} cb={1} cbColor="#FFD23F" signals={1} />
        <Sparkle position={[1.1, 3.0, 0.4]} s={0.35 * pop(t, 0.4)} rotation={[0, 0, t * 3]} />
      </>
    ),
    tags: [{ text: 'Penting!', color: 'yellow', at: [0, 3.0, 0], delay: 0.4 }],
  },
  /* 19 */ {
    chip: 'BAJU BERGESEL', anchor: [13, 0], env: 'studio',
    cam: (t) => ({ pos: [lerp(-0.8, 0.6, t / 2.7) + 0.4, 2.0, 6.6], target: [lerp(-0.8, 0.6, t / 2.7), 1.3, 0], fov: 35 }),
    world: ({ t }) => {
      const x = lerp(-0.8, 0.6, t / 2.7);
      return (
        <>
          <AbangBlok t={t * 2} pose="idle" position={[x, Math.abs(Math.sin(t * 7)) * 0.06, 0]} rotation={[0, 0.5, Math.sin(t * 7) * 0.04]} />
          <Streaks t={t} position={[x + 0.45, 1.2, 0.35]} color="#4CC9F0" n={4} />
          <Streaks t={t + 0.4} position={[x - 0.45, 1.3, 0.2]} color="#4CC9F0" n={4} />
        </>
      );
    },
    tags: [{ text: 'Baju bergesel', color: 'blue', at: (t) => [lerp(-0.8, 0.6, t / 2.7) + 0.9, 2.2, 0], delay: 0.4 }],
  },
  /* 20 */ {
    chip: 'RASA DISENTUH', anchor: [14, 0], env: 'studio',
    cam: cam([0, 2.0, 6.8], [0, 1.4, 0], [0.3, 1.9, 6.0], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="shocked" />
        {[[-1.0, 1.4, 0.3, 0.9], [1.0, 1.1, 0.3, -0.9], [0.8, 2.3, 0.2, -0.5], [-0.8, 0.7, 0.4, 1.2]].map(([x, y, z, r], i) => (
          <Hand key={i} ghost position={[x + Math.sin(t * 8 + i) * 0.05, y, z]} rotation={[0, 0, r]} scale={0.6 * pop(t, 0.1 + i * 0.15, 0.25)} />
        ))}
      </>
    ),
    tags: [{ text: 'Rasa disentuh!', color: 'red', at: [0, 2.9, 0], delay: 0.5 }],
    overlay: ({ t }) => <EdgeWarning t={t} start={0.3} />,
  },
  /* 21 */ {
    chip: 'JADI KALAU...', anchor: [15, 0], env: 'studio',
    cam: cam([0.4, 2.1, 7.4], [0, 1.4, 0], [-0.2, 2.0, 6.6], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="scratch" position={[-0.8, 0, 0]} rotation={[0, 0.35, 0]} />
        <AbangBlok t={t} pose="present" side={-1} outfit={KAWAN} position={[0.9, 0, -0.2]} rotation={[0, -0.4, 0]} />
        <QMark position={[-0.35, 2.85, 0.2]} scale={0.7 * pop(t, 0.3)} />
      </>
    ),
    tags: [{ text: 'Hmm...', color: 'black', at: [-0.8, 3.1, 0], delay: 0.5 }],
  },
  /* 22 */ {
    chip: 'BOLEH GELETEK SENDIRI?', anchor: [15, 5], env: 'studio',
    cam: cam([0, 2.0, 6.6], [0, 1.45, 0], [0.4, 1.9, 5.8], [0, 1.45, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="laugh" outfit={KAWAN} position={[0, 0, 0]} />
        <Streaks t={t} position={[0.6, 1.2, 0.3]} color="#FF7EB6" n={3} />
        <Streaks t={t + 0.2} position={[-0.6, 1.2, 0.3]} color="#FF7EB6" n={3} />
        <QMark position={[1.0, 2.6, 0.2]} scale={0.8 * pop(t, 0.5)} />
      </>
    ),
    tags: [{ text: 'Diri sendiri?', color: 'yellow', at: [-0.9, 2.7, 0], delay: 0.45 }],
  },
  /* 23 */ {
    chip: 'OTAK LAIN SIKIT', anchor: [16, 0], env: 'studio',
    cam: cam([0, 2.2, 6.8], [0, 1.9, 0], [0.5, 2.1, 6.0], [0, 1.9, 0]),
    world: ({ t }) => (
      <>
        <Brain t={t} position={[0, 1.9 + Math.sin(t * 3) * 0.08, 0]} scale={0.8 * pop(t, 0, 0.4)} rotation={[0, Math.sin(t * 1.5) * 0.4, Math.sin(t * 2) * 0.08]} color="#B9A2FF" face="wow" cb={0.6} cbColor="#FF7EB6" />
        {[[-1.1, 2.9, 0.3], [1.1, 2.5, 0.3], [0.8, 3.3, 0]].map((p, i) => (
          <Sparkle key={i} position={p as V3} s={0.3 * pop(t, 0.3 + i * 0.15)} color={i === 1 ? '#FF7EB6' : '#FFD23F'} rotation={[0, 0, t * 3]} />
        ))}
      </>
    ),
    tags: [{ text: 'Lain sikit', color: 'pink', at: [0.9, 1.1, 0], delay: 0.6 }],
  },
  /* 24 */ {
    chip: 'TAG KAWAN KAU', anchor: [17, 0], env: 'studio',
    cam: cam([0, 2.1, 7.6], [0, 1.5, 0], [0.4, 2.0, 6.8], [0, 1.5, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="point" position={[-0.85, 0, 0]} rotation={[0, 0.35, 0]} />
        <AbangBlok t={t} pose="laugh" outfit={KAWAN} position={[0.9, 0, -0.2]} rotation={[0, -0.35, 0]} />
        <Feather position={[0.35 + Math.sin(t * 15) * 0.1, 1.2, 0.4]} rotation={[0, 0, 1.0 + Math.sin(t * 16) * 0.4]} scale={0.55 * pop(t, 0.3)} />
        {[[-0.35, 2.75, 0.3], [0.35, 3.0, 0.1], [1.0, 2.75, 0.2]].map((p, i) => (
          <group key={i} position={[p[0], p[1] + Math.sin(t * 3 + i) * 0.08, p[2]]} scale={pop(t, 0.8 + i * 0.25, 0.3)} rotation={[0, 0, (i - 1) * 0.15]}>
            <TextCard text="@" bg={['#3DDC84', '#FFD23F', '#4CC9F0'][i]} fg="#16181D" w={0.55} h={0.55} font={90} depth={0.18} radius={0.08} />
          </group>
        ))}
      </>
    ),
    tags: [{ text: 'Tag kawan kau!', color: 'green', at: [0, 0.3, 0.3], delay: 0.5 }],
  },
];

if (scenes.length !== 24) throw new Error(`Expected 24 scenes, got ${scenes.length}`);

export const V03_SCENES = scenes;
export const V03_Geletek: React.FC = () => <VideoEngine scenes={scenes} data={DATA} audio="audio/v03_geletek.mp3" />;
void backOut;
void clamp01;
