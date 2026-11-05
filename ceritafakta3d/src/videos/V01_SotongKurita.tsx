import React from 'react';
import * as THREE from 'three';
import words from '../../data/v01_words.json';
import { SceneDef, VideoEngine } from '../components/VideoEngine';
import { WordsFile } from '../lib/timing';
import { CamPose, dolly, orbit, projectToScreen } from '../lib/camera';
import { backOut, bounceOut, clamp01, dropY, easeInCubic, easeInOut, easeOutCubic, lerp, pop, prog, rand, V3 } from '../lib/easing';
import { C } from '../lib/theme';
import { AbangBlok } from '../objects/AbangBlok';
import { Heart } from '../objects/Heart';
import { ArmParams, blendArm, computeArm, MODES, Octopus } from '../objects/Octopus';
import {
  Beaker, Bench, BloodCell, BloodTube, Bubble, Coin, Crab, Drop, Feather, Gill, Jar, Molecule, NeuronNet, O2,
  PeriodicTile, PieSlice, QMark, Shell, Sparkle, Stream, TextCard, TorchBeam, UFO,
} from '../objects/Props';
import { Rock, Seaweed } from '../envs/Env';
import { Battery, BarPanel, CounterPanel, EcgPanel, SplitDivider, TeaserCard } from '../components/Panel';
import { EdgeWarning } from '../components/Flash';

const DATA = words as WordsFile;
export const V01_DURATION = DATA.duration;

const cam = (p0: V3, t0: V3, p1: V3, t1: V3, fov = 35, whip?: number) =>
  dolly({ pos: p0, target: t0, fov }, { pos: p1, target: t1, fov }, { whip });

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Thought bubbles rising from a point. */
const Thought: React.FC<{ at: V3; t: number; delay?: number }> = ({ at, t, delay = 0 }) => (
  <group position={at}>
    {[0.08, 0.13, 0.22].map((r, i) => {
      const s = pop(t, delay + i * 0.12, 0.25);
      return (
        <mesh key={i} position={[i * 0.18, 0.25 + i * 0.3, 0]} scale={s}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
      );
    })}
  </group>
);

/** Local→world for an object placed with position + uniform scale + y rotation. */
const toWorld = (p: THREE.Vector3, pos: V3, s = 1, ry = 0): V3 => {
  const v = p.clone().multiplyScalar(s).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
  return [v.x + pos[0], v.y + pos[1], v.z + pos[2]];
};
const armTip = (i: number, mode: Parameters<typeof computeArm>[1], arm: Parameters<typeof computeArm>[2], t: number) => {
  const pts = computeArm(i, mode, arm, t);
  return pts[pts.length - 1];
};

/* ---------------- scene 26 arm jobs ---------------- */
const jobsArm = (i: number, t: number): Partial<ArmParams> => {
  if (i === 1) return { elev: 0.15, bend: -0.25, curl: 1.4, wave: 0.05, len: 2.1, yaw: 1.2 }; // → jar
  if (i === 6) return { elev: 0.55 + Math.sin(t * 2) * 0.08, bend: -0.6, curl: 0.4, wave: 0.04, len: 1.9, yaw: 5.05, ground: false }; // holds shell up
  if (i === 2) return { elev: 1.15, bend: -0.2, curl: 0.2 + Math.sin(t * 7) * 0.7, wave: 0.1, len: 1.9, ground: false }; // waves
  if (i === 4) return { elev: -0.25, bend: 0.1, curl: 0.3, wave: 0.08, len: 2.5, yaw: 3.75 }; // hides in rock
  return {};
};

/* ---------------- scene list ---------------- */
const scenes: SceneDef[] = [
  /* 1 */ {
    chip: 'ADA SATU HAIWAN', anchor: [0, 0], env: 'deep',
    cam: cam([0, 2.2, 9], [0, 1.8, -1], [0.3, 2.0, 7.6], [0, 1.7, -1], 35, 0),
    world: ({ t }) => {
      const sweep = lerp(0.12, 0.62, easeInOut(prog(t, 0.05, 0.8)));
      const hit = clamp01((sweep - 0.45) / 0.15);
      const ox = 0.4 - t * 0.25;
      return (
        <>
          <group position={[-3.4, 6.4, 1.2]} rotation={[0, 0, sweep]}>
            <TorchBeam len={11} opacity={0.2} />
            <mesh rotation={[0, 0, 0]} position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.22, 0.16, 0.7, 20]} />
              <meshStandardMaterial color="#FFD23F" roughness={0.5} emissive="#FFD23F" emissiveIntensity={0.3} />
            </mesh>
          </group>
          <pointLight position={[ox - 0.8, 3.4, 1.5]} intensity={60 * hit} color="#FFF0C0" distance={9} />
          <pointLight position={[ox, 2.0, -3.5]} intensity={18} color="#5DA9FF" distance={8} />
          <Octopus t={t} mode="swim" silhouette position={[ox, 1.4 + Math.sin(t * 2) * 0.12, -1]} rotation={[0.15, 0.4, 0]} arm={() => ({ spread: 0.95, elev: -1.25, wave: 0.35 })} />
        </>
      );
    },
    tags: [{ text: '?', color: 'black', at: (t) => [0.4 - t * 0.25 + 0.9, 3.4, -1], delay: 0.75, size: 60 }],
  },
  /* 2 */ {
    chip: 'TIGA JANTUNG', anchor: [0, 4], env: 'studio',
    cam: cam([0, 2.4, 8.2], [0, 1.0, 0], [0.7, 2.1, 7.2], [0, 1.0, 0]),
    world: ({ t }) => (
      <>
        {[-1.25, 0, 1.25].map((x, i) => (
          <Heart key={i} t={t + i * 0.2} bpm={95} size={0.85} position={[x, 0.56 + dropY(t, i * 0.22, 0.5, 6), 0]} rotation={[0, (i - 1) * -0.25, (i - 1) * -0.08]} />
        ))}
      </>
    ),
    tags: [{ text: 'x3', color: 'red', at: [1.5, 1.6, 0], delay: 0.85, size: 56 }],
    overlay: ({ t }) => <CounterPanel t={t} times={[0.32, 0.54, 0.76]} label="JANTUNG" />,
  },
  /* 3 */ {
    chip: 'DARAH DIA?', anchor: [1, 0], env: 'lab',
    cam: cam([0, 3.6, 7.4], [0, 2.6, 0], [0, 3.3, 6.5], [0, 2.6, 0]),
    world: ({ t }) => {
      const fall = easeInCubic(prog(t, 0, 0.75));
      const dy = lerp(6, 2.62, fall);
      const sp = prog(t, 0.75, 0.5);
      return (
        <>
          <Bench position={[0, 0, 0]} />
          <Beaker position={[0, 1.76, 0]} fill={0.45} liquid="#AEB5C4" />
          {[[-2.3, '#3DDC84'], [2.2, '#FFD23F'], [2.9, '#FF7EB6']].map(([x, c], i) => (
            <group key={i} position={[x as number, 1.76, -0.6]}>
              <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.32, 1, 24]} />
                <meshStandardMaterial color={c as string} roughness={0.4} />
              </mesh>
              <mesh position={[0, 1.15, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
                <meshStandardMaterial color="#E9EEF5" />
              </mesh>
            </group>
          ))}
          {sp === 0 && <Drop position={[0, dy, 0]} scale={[0.22, 0.22 * (1 + fall * 0.3), 0.22]} color="#5B6170" />}
          {sp > 0 && (
            <>
              <mesh position={[0, 2.6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.2 + sp * 2.2}>
                <torusGeometry args={[0.25, 0.04 * (1 - sp) + 0.005, 8, 40]} />
                <meshStandardMaterial color="#FFFFFF" transparent opacity={1 - sp} />
              </mesh>
              {Array.from({ length: 7 }).map((_, i) => {
                const a = (i / 7) * Math.PI * 2;
                const r = sp * 0.5;
                return (
                  <mesh key={i} position={[Math.cos(a) * r, 2.62 + Math.sin(sp * Math.PI) * 0.55, Math.sin(a) * r]}>
                    <sphereGeometry args={[0.05, 8, 6]} />
                    <meshStandardMaterial color="#5B6170" />
                  </mesh>
                );
              })}
            </>
          )}
        </>
      );
    },
    tags: [{ text: 'Darah?', color: 'black', at: (t) => [0.75, Math.max(3.0, lerp(6, 2.62, easeInCubic(prog(t, 0, 0.75)))), 0], delay: 0.15 }],
  },
  /* 4 */ {
    chip: 'WARNA BIRU', anchor: [2, 0], env: 'lab',
    cam: cam([1.4, 3.3, 4.4], [0, 2.45, 0], [0.4, 3.0, 3.6], [0, 2.45, 0], 35, 0.2),
    world: ({ t }) => {
      const k = easeInOut(prog(t, 0.1, 0.6));
      const col = new THREE.Color('#AEB5C4').lerp(new THREE.Color('#1F6BFF'), k);
      return (
        <>
          <Bench position={[0, 0, 0]} />
          <Beaker position={[0, 1.76, 0]} fill={0.45} liquid={`#${col.getHexString()}`} glow={k * 0.8} t={t} swirl={1} />
          <pointLight position={[0, 2.6, 0.9]} intensity={8 * k} color="#4C8DFF" distance={4} />
          {[[-0.9, 3.3, 0.4], [0.9, 3.1, 0.3], [0.2, 3.6, 0.5]].map((p, i) => (
            <Sparkle key={i} position={p as V3} s={0.35 * pop(t, 0.55 + i * 0.12)} color="#4CC9F0" rotation={[0, 0, t * 2]} />
          ))}
        </>
      );
    },
    tags: [{ text: 'Biru!', color: 'blue', at: [0.95, 2.75, 0.3], delay: 0.55, size: 56 }],
  },
  /* 5 */ {
    chip: 'SOTONG KURITA', anchor: [3, 0], env: 'seabed',
    cam: orbit([-0.5, 1.4, 0], 9.2, 2.8, -0.75, 0.75, 35),
    world: ({ t }) => (
      <>
        <Rock position={[0, 0, 0]} s={1.5} seed={21} color="#9AA0AE" />
        <Octopus t={t} position={[0, 0.42 + Math.sin(t * 2.5) * 0.04, 0]} scale={pop(t, 0, 0.45)} />
        <AbangBlok t={t} pose="point" mask position={[-2.7, 0, 0.6]} rotation={[0, 0.55, 0]} />
        <Bubble position={[-2.4, 2.8 + ((t * 0.8) % 2), 1]} r={0.1} />
        <Bubble position={[-2.3, 3.4 + ((t * 0.8) % 2), 1]} r={0.07} />
      </>
    ),
    tags: [
      { text: 'Sotong kurita', color: 'green', at: [0, 3.25, 0], delay: 0.35 },
      { text: 'octopus', color: 'black', at: [1.8, 0.6, 0.8], delay: 0.7, rot: 4 },
    ],
  },
  /* 6 */ {
    chip: 'DUA JANTUNG KECIL', anchor: [4, 0], env: 'studio',
    cam: cam([0, 2.1, 7.6], [0, 1.35, 0], [0, 1.8, 6.2], [0, 1.3, 0]),
    world: ({ t }) => (
      <Octopus t={t} xray={easeOutCubic(prog(t, 0, 0.4))} gillHearts={0.5 + 0.5 * Math.sin(t * 8)} bodyHeartVisible={false} showHearts rotation={[0, Math.sin(t) * 0.15, 0]} />
    ),
    tags: [
      { text: 'Jantung 1', color: 'red', at: [-0.5, 1.2, 0], dx: -170, dy: -40, delay: 0.5 },
      { text: 'Jantung 2', color: 'red', at: [0.5, 1.2, 0], dx: 170, dy: 40, delay: 0.8 },
    ],
  },
  /* 7 */ {
    chip: 'PAM KE INSANG', anchor: [4, 3], env: 'macro',
    cam: cam([0, 1.8, 7.6], [0, 1.45, 0], [0.4, 1.9, 6.8], [0, 1.45, 0]),
    world: ({ t }) => {
      const L = [v3(-1.2, 1.05, 0.8), v3(-1.1, 1.7, 0.6), v3(-0.7, 2.2, 0.3), v3(-0.15, 2.45, 0.1)];
      const R = [v3(1.2, 1.05, 0.8), v3(1.1, 1.7, 0.6), v3(0.7, 2.2, 0.3), v3(0.15, 2.45, 0.1)];
      return (
        <>
          <Gill t={t} position={[0, 2.75, -0.3]} scale={0.62} />
          <Heart t={t} bpm={110} size={0.6} position={[-1.2, 0.7, 0.8]} glow={0.4} />
          <Heart t={t + 0.25} bpm={110} size={0.6} position={[1.2, 0.7, 0.8]} glow={0.4} />
          <Stream path={L} t={t} c0="#9AA1AE" c1="#9AA1AE" n={12} speed={0.6} />
          <Stream path={R} t={t + 0.3} c0="#9AA1AE" c1="#9AA1AE" n={12} speed={0.6} />
        </>
      );
    },
    tags: [{ text: 'Insang', color: 'pink', at: [0.8, 3.55, -0.3], delay: 0.35 }],
  },
  /* 8 */ {
    chip: 'AMBIL OKSIGEN', anchor: [5, 0], env: 'macro',
    cam: cam([2.6, 3.4, 4.8], [0, 2.6, 0], [1.8, 3.1, 4.1], [0, 2.6, 0]),
    world: ({ t }) => {
      const path = [v3(-3.2, 2.5, 0.5), v3(-1.5, 2.6, 0.45), v3(0, 2.62, 0.45), v3(1.5, 2.6, 0.45), v3(3.2, 2.5, 0.5)];
      return (
        <>
          <Gill t={t} position={[0, 2.62, -0.2]} />
          <Stream path={path} t={t} c0="#9AA1AE" c1="#2F7BFF" switchAt={0.5} n={20} speed={0.32} size={0.13} />
          {Array.from({ length: 9 }).map((_, i) => {
            const k = (((t * 0.55 + i / 9) % 1) + 1) % 1;
            const from: V3 = [1.2 + rand(i) * 2.2, 5.2 + rand(i + 4), 0.8 + rand(i + 2)];
            const to: V3 = [-1.2 + (i / 9) * 2.4, 2.8, 0.4];
            const p: V3 = [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)];
            return <O2 key={i} position={p} scale={0.55 * (1 - k * 0.6)} rotation={[0, 0, t * 2 + i]} glow={0.4} />;
          })}
        </>
      );
    },
    tags: [{ text: 'O₂ oksigen', color: 'blue', at: [2.0, 4.4, 1.0], delay: 0.3 }],
  },
  /* 9 */ {
    chip: 'SATU JANTUNG BESAR', anchor: [6, 0], env: 'studio',
    cam: cam([0, 2.3, 7.0], [0, 1.45, 0], [0, 2.0, 4.8], [0, 1.5, 0]),
    world: ({ t }) => {
      const grow = backOut(prog(t, 0.1, 0.4));
      const pipes = Array.from({ length: 8 }).map((_, i) => {
        const yaw = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return [v3(0, 1.55, -0.15), v3(Math.sin(yaw) * 0.35, 1.0, Math.cos(yaw) * 0.35), v3(Math.sin(yaw) * 0.9, 0.35, Math.cos(yaw) * 0.9), v3(Math.sin(yaw) * 1.6, 0.2, Math.cos(yaw) * 1.6)];
      });
      return (
        <>
          <Octopus t={t} xray={1} showHearts bodyHeart={1} bodyHeartSize={0.5 + 0.3 * grow} gillHearts={0} />
          {t > 0.35 && pipes.map((p, i) => <Stream key={i} path={p} t={t + i * 0.1} c0="#E23B4A" c1="#E23B4A" n={6} speed={0.7} size={0.06} />)}
        </>
      );
    },
    tags: [{ text: 'Jantung 3', color: 'red', at: [0, 2.05, -0.15], dx: 200, dy: -60, delay: 0.4 }],
  },
  /* 10 */ {
    chip: 'KE SELURUH BADAN', anchor: [6, 3], env: 'studio',
    cam: cam([0, 10.5, 1.6], [0, 0, 0.1], [0, 9.2, 1.0], [0, 0, 0.1], 38),
    world: ({ t }) => (
      <Octopus
        t={t}
        rotation={[0, t * 0.25, 0]}
        arm={() => ({ len: 2.4, curl: 1.6 })}
        armGlow={Array.from({ length: 8 }).map((_, i) => clamp01((t - 0.15 - i * 0.11) / 0.5))}
        glowColor="#FFD23F"
      />
    ),
    tags: [{ text: 'Seluruh badan', color: 'yellow', at: [2.0, 0.2, 1.4], delay: 0.6 }],
  },
  /* 11 */ {
    chip: 'YANG PELIKNYA', anchor: [7, 0], env: 'studio',
    cam: cam([0, 2.3, 9.2], [0, 1.4, 0], [0.6, 2.1, 8.2], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="scratch" position={[-1.05, 0, 0.2]} scale={0.85} rotation={[0, 0.35, 0]} />
        <Octopus t={t} position={[1.15, 0, -0.3]} scale={0.62} tilt={Math.sin(t * 4) * 0.22} rotation={[0, -0.35, 0]} />
        <QMark position={[-0.75, 2.85, 0.2]} scale={0.9 * pop(t, 0.15)} />
        <QMark position={[-0.2, 3.3, 0.2]} scale={0.65 * pop(t, 0.35)} color="#FFFFFF" />
        <QMark position={[1.35, 2.45, 0]} scale={0.8 * pop(t, 0.5)} />
      </>
    ),
    tags: [{ text: 'Pelik?', color: 'yellow', at: [0.6, 3.1, 0], delay: 0.55, rot: -6 }],
  },
  /* 12 */ {
    chip: 'BILA BERENANG', anchor: [8, 0], env: 'water',
    cam: (t, d) => {
      const y = 1.2 + t * 1.6;
      return { pos: [2.6 - t * 0.3, y + 0.7, 7.2], target: [0, y + 0.9, 0], fov: 35 } as CamPose;
    },
    world: ({ t }) => {
      const y = 1.2 + t * 1.6 + Math.sin(t * 6) * 0.08;
      return (
        <>
          <Octopus t={t} mode="swim" position={[0, y, 0]} rotation={[0.2, 0.3, 0]} />
          {Array.from({ length: 14 }).map((_, i) => {
            const age = ((i / 14) * 1.2 + t * 0.9) % 1.2;
            const by = y - 0.6 - (1.2 - age) * 2.2;
            return <Bubble key={i} position={[(rand(i) - 0.5) * 0.9 + Math.sin(t * 3 + i) * 0.1, by + age * 1.2, (rand(i + 3) - 0.5) * 0.6]} r={0.07 + rand(i + 9) * 0.1} />;
          })}
        </>
      );
    },
    tags: [{ text: 'Berenang', color: 'blue', at: (t) => [1.3, 1.2 + t * 1.6 + 2.6, 0], delay: 0.4 }],
  },
  /* 13 */ {
    chip: 'JANTUNG BERHENTI', anchor: [9, 0], env: 'water',
    cam: cam([0.6, 2.1, 5.6], [0, 1.45, 0], [0, 1.85, 4.3], [0, 1.5, 0]),
    world: ({ t }) => {
      const dead = easeOutCubic(prog(t, 1.25, 0.5));
      return (
        <>
          <Octopus t={t} mode="swim" xray={1} showHearts bodyHeart={1 - dead} bodyHeartDead={dead} bodyHeartSize={0.62} position={[0, Math.sin(t * 3) * 0.08, 0]} />
          {Array.from({ length: 10 }).map((_, i) => (
            <Bubble key={i} position={[(rand(i) - 0.5) * 4, ((rand(i + 2) * 6 - t * 1.4) % 6 + 6) % 6 - 1.5, -1 - rand(i + 5) * 2]} r={0.06 + rand(i) * 0.08} />
          ))}
        </>
      );
    },
    tags: [{ text: 'Berhenti!', color: 'red', at: [0, 1.55, -0.15], dx: 230, dy: 20, delay: 1.35, size: 52 }],
    overlay: ({ t }) => (
      <>
        <EdgeWarning t={t} start={1.25} />
        <EcgPanel t={t} flatAt={1.25} label="JANTUNG BADAN" />
      </>
    ),
  },
  /* 14 */ {
    chip: 'LEBIH SUKA', anchor: [10, 0], env: 'seabed',
    cam: cam([-1.8, 2.0, 7.6], [0, 1.2, 0], [-1.0, 1.5, 6.6], [0, 1.0, 0]),
    world: ({ t }) => {
      const k = easeOutCubic(prog(t, 0, 1.1));
      const y = lerp(3.2, 0, k);
      const puff = prog(t, 0.85, 0.9);
      return (
        <>
          <Octopus t={t} position={[0, y, 0]} arm={() => blendArm(MODES.swim, MODES.idle, easeInOut(prog(t, 0.3, 0.8)))} />
          {puff > 0 &&
            Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * Math.PI * 2;
              const r = 1.4 + easeOutCubic(puff) * 1.4;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.15 + Math.sin(puff * Math.PI) * 0.35 * rand(i), Math.sin(a) * r]} scale={(1 - puff) * (0.15 + rand(i) * 0.15)}>
                  <sphereGeometry args={[1, 10, 8]} />
                  <meshStandardMaterial color="#F3E3BC" roughness={1} transparent opacity={0.9} />
                </mesh>
              );
            })}
        </>
      );
    },
  },
  /* 15 */ {
    chip: 'MERANGKAK', anchor: [10, 5], env: 'seabed', decor: false,
    cam: (t) => {
      const x = -1.6 + t * 1.15;
      return { pos: [x + 0.6, 1.7, 7.0], target: [x + 0.3, 0.9, 0], fov: 35 };
    },
    world: ({ t }) => {
      const x = -1.6 + t * 1.15;
      return (
        <>
          <Octopus
            t={t}
            mode="crawl"
            scale={0.8}
            position={[x, Math.abs(Math.sin(t * 6)) * 0.08, 0]}
            rotation={[0, Math.PI / 2 - 0.4, 0]}
            arm={(i) => ({ elev: -0.8 + 0.55 * Math.max(0, Math.sin(t * 7 + (i * Math.PI) / 2)) })}
          />
          <Rock position={[-4, 0, -1.2]} s={1.1} seed={31} />
          <Rock position={[0.8, 0, -1.6]} s={0.9} seed={33} />
          <Rock position={[3.6, 0, -1.0]} s={1.3} seed={35} />
          <Seaweed position={[-1.5, 0, -2.2]} t={t} h={7} />
          <Seaweed position={[2.6, 0, -2.6]} t={t} h={9} seed={3} />
          <Shell position={[-0.5, 0, 1.1]} rotation={[0, 0.5, 0]} />
          <Shell position={[2.4, 0, 0.9]} rotation={[0, -0.4, 0]} color="#FFC4D6" />
          <Crab t={t} position={[3.6 - t * 1.6, 0, 1.6]} rotation={[0, 0.3, 0]} />
        </>
      );
    },
    tags: [{ text: 'Merangkak', color: 'green', at: (t) => [-1.6 + t * 1.15, 2.6, 0], delay: 0.3 }],
  },
  /* 16 */ {
    chip: 'CEPAT PENAT', anchor: [11, 0], env: 'split',
    cam: cam([0, 2.3, 9.4], [0, 1.4, 0], [0, 2.2, 8.8], [0, 1.4, 0], 45, 0.05),
    world: ({ t }) => (
      <>
        <Octopus t={t} mode="swim" scale={0.72} position={[-1.45, 1.4 + Math.sin(t * 5) * 0.15, 0]} arm={() => ({ spread: 0.5 })} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Bubble key={i} position={[-1.45 + (rand(i) - 0.5) * 0.8, 0.7 + ((t * 1.2 + i * 0.4) % 2.4), 0.3]} r={0.06 + rand(i) * 0.06} />
        ))}
        <Octopus t={t} mode="crawl" scale={0.66} position={[1.45, 0, 0]} arm={(i) => ({ len: 1.5, elev: -0.8 + 0.4 * Math.max(0, Math.sin(t * 5 + i * 1.6)) })} />
        <Rock position={[2.6, 0, -1.2]} s={0.7} seed={41} />
        <Shell position={[0.7, 0, 0.9]} />
      </>
    ),
    tags: [
      { text: 'Berenang', color: 'red', at: [-1.45, 0.2, 0], delay: 0.3, rot: -4 },
      { text: 'Merangkak', color: 'green', at: [1.45, -0.35, 0], delay: 0.5, rot: 4 },
    ],
    overlay: ({ t, pose }) => {
      const L = projectToScreen(pose, [-1.45, 3.4, 0]);
      const R = projectToScreen(pose, [1.45, 2.6, 0]);
      const s = pop(t, 0.1, 0.3);
      return (
        <>
          <SplitDivider t={t} />
          <Battery x={L.x} y={L.y} level={lerp(1, 0.08, easeInOut(prog(t, 0.3, 1.5)))} s={s} />
          <Battery x={R.x} y={R.y} level={0.95} s={s} />
        </>
      );
    },
  },
  /* 17 */ {
    chip: 'DARAH KITA', anchor: [12, 0], env: 'studio',
    cam: cam([-0.4, 2.1, 8.0], [0, 1.45, 0], [0.4, 1.95, 7.0], [0, 1.45, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="present" position={[-0.95, 0, 0]} rotation={[0, 0.25, 0]} />
        <group position={[0.95, 1.75, 0.2]} rotation={[0, 0, Math.PI / 2]} scale={pop(t, 0.05, 0.4)}>
          <BloodTube t={t} len={3.2} n={10} />
        </group>
        <mesh position={[0.95, 0.08, 0.2]} castShadow>
          <cylinderGeometry args={[0.7, 0.75, 0.16, 32]} />
          <meshStandardMaterial color="#F3F4F7" roughness={0.6} />
        </mesh>
      </>
    ),
    tags: [{ text: 'Darah merah', color: 'red', at: [0.95, 3.5, 0.2], delay: 0.35 }],
  },
  /* 18 */ {
    chip: 'ZAT BESI', anchor: [12, 3], env: 'studio',
    cam: cam([0, 2.3, 7.2], [0, 1.9, 0], [0, 2.15, 6.2], [0, 1.9, 0]),
    world: ({ t }) => {
      const flip = backOut(prog(t, 0.0, 0.5));
      return (
        <>
          <PeriodicTile symbol="Fe" num={26} name="Besi" color="#B5473A" position={[0, 2.0, 0]} rotation={[0, Math.PI * (1 - flip), 0]} scale={0.6 + 0.4 * flip} />
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (i / 9) * Math.PI * 2 + t * 0.8;
            const k = easeOutCubic(prog(t, 0.3 + i * 0.04, 0.6));
            const r = lerp(4, 1.55, k);
            return <BloodCell key={i} position={[Math.cos(a) * r, 2.0 + Math.sin(a) * r * 0.9, 0.4 + Math.sin(a * 2) * 0.3]} rotation={[a, t + i, 0]} scale={0.5} />;
          })}
        </>
      );
    },
    tags: [{ text: 'Zat besi (Fe)', color: 'black', at: [0, 0.6, 0.5], delay: 0.45 }],
  },
  /* 19 */ {
    chip: 'TEMBAGA', anchor: [13, 0], env: 'studio',
    cam: cam([2.4, 1.7, 6.8], [0, 1.7, 0], [1.4, 1.9, 6.0], [0, 1.7, 0]),
    world: ({ t }) => {
      const flip = backOut(prog(t, 0.0, 0.5));
      return (
        <>
          <PeriodicTile symbol="Cu" num={29} name="Tembaga" color="#C8773E" metal position={[0, 2.1, 0]} rotation={[0, Math.PI * (1 - flip) + Math.sin(t * 2.2) * 0.35, 0]} scale={0.6 + 0.4 * flip} />
          {Array.from({ length: 7 }).map((_, i) => (
            <Coin key={i} position={[1.2, 0.05 + i * 0.105 + dropY(t, 0.25 + i * 0.12, 0.35, 3), 0.7]} rotation={[0, i * 0.7, 0]} />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <Coin key={`b${i}`} position={[-1.2, 0.05 + i * 0.105 + dropY(t, 0.45 + i * 0.12, 0.35, 3), 0.5]} rotation={[0, i * 1.1, 0]} />
          ))}
        </>
      );
    },
    tags: [{ text: 'Tembaga (Cu)', color: 'copper', at: [0, 3.35, 0], delay: 0.4 }],
  },
  /* 20 */ {
    chip: 'HEMOSIANIN', anchor: [14, 0], env: 'darklab',
    cam: cam([0, 3.0, 7.2], [0, 2.2, 0], [0.5, 2.7, 6.0], [0, 2.2, 0]),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.4, 1.6, 0.6, 48]} />
          <meshStandardMaterial color="#3A4150" roughness={0.6} />
        </mesh>
        <Molecule position={[0, 2.3, 0]} rotation={[0.3, t * 1.2, 0.1]} scale={pop(t, 0, 0.45) * 0.8} copperGlow={0.6 + 0.4 * Math.sin(t * 6)} />
        <pointLight position={[0, 2.3, 1.5]} intensity={6} color="#FF9A4A" distance={5} />
      </>
    ),
    tags: [{ text: 'Hemosianin', color: 'yellow', at: [0, 3.9, 0], delay: 0.35 }],
  },
  /* 21 */ {
    chip: 'JADI BIRU', anchor: [15, 0], env: 'darklab',
    cam: cam([-2.4, 2.7, 6.0], [0, 2.2, 0], [-1.0, 2.6, 5.2], [0, 2.2, 0]),
    world: ({ t }) => {
      const o2 = easeOutCubic(prog(t, 0.15, 0.7));
      const blue = easeInOut(prog(t, 0.8, 0.5));
      const morph = easeInOut(prog(t, 1.75, 0.6));
      return (
        <>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.4, 1.6, 0.6, 48]} />
            <meshStandardMaterial color="#3A4150" roughness={0.6} />
          </mesh>
          {morph < 1 && <Molecule position={[0, 2.3, 0]} rotation={[0.3, 1.5 + t * 1.2, 0.1]} scale={0.8 * (1 - morph)} o2={o2} blue={blue} copperGlow={0.5} />}
          {morph > 0 && <Drop position={[0, 2.1 + Math.sin(t * 3) * 0.05, 0]} rotation={[0, t * 2, 0]} scale={0.6 * backOut(morph)} color="#2F7BFF" glow={0.25} />}
          <pointLight position={[0, 2.3, 1.5]} intensity={10 * blue} color="#4C8DFF" distance={6} />
        </>
      );
    },
    tags: [{ text: '+ O₂ = biru', color: 'blue', at: [0.4, 4.0, 0], delay: 0.9 }],
  },
  /* 22 */ {
    chip: 'SATU LAGI', anchor: [16, 0], env: 'studio',
    cam: cam([0, 2.0, 6.8], [0, 1.8, 0], [0, 2.2, 5.6], [0, 1.8, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="oneFinger" position={[0, dropY(t, 0, 0.45, 3), 0]} />
        <Sparkle position={[0.9, 3.4, 0.2]} s={0.6 * pop(t, 0.4)} rotation={[0, 0, t * 3]} />
        <Sparkle position={[1.3, 2.95, 0.2]} s={0.35 * pop(t, 0.5)} rotation={[0, 0, -t * 3]} color="#FFFFFF" />
      </>
    ),
    tags: [{ text: '1 lagi!', color: 'yellow', at: [-1.2, 3.2, 0], delay: 0.45, size: 52 }],
  },
  /* 23 */ {
    chip: 'SEL SARAF', anchor: [17, 0], env: 'neon',
    cam: cam([0, 2.2, 10], [0, 2.0, 0], [0.6, 2.0, 6.4], [0, 2.0, 0], 38),
    world: ({ t }) => <NeuronNet t={t} n={60} radius={3} position={[0, 2, 0]} rotation={[0, t * 0.3, 0]} />,
  },
  /* 24 */ {
    chip: '2/3 DALAM LENGAN', anchor: [17, 6], env: 'studio',
    cam: cam([0, 3.4, 9.2], [0.1, 1.0, 0], [0.4, 3.0, 8.3], [0.1, 1.0, 0]),
    world: ({ t }) => {
      const fly = easeInOut(prog(t, 0.25, 0.55));
      const glow = easeOutCubic(prog(t, 0.7, 0.45));
      const big: V3 = [lerp(-0.75, 0.9, fly), lerp(0.4, 0.6, fly) + Math.sin(fly * Math.PI) * 1.6, lerp(0.6, 0, fly)];
      return (
        <>
          <group position={[-0.75, 0.05, 0.6]} rotation={[0.25, 0, 0]}>
            <PieSlice start={(Math.PI * 4) / 3} len={(Math.PI * 2) / 3} color="#4CC9F0" r={1.1} />
          </group>
          {fly < 0.98 && (
            <group position={big} rotation={[0.25, fly * 3, 0]} scale={1 - fly * 0.8}>
              <PieSlice start={0} len={(Math.PI * 4) / 3} color="#FFD23F" r={1.1} />
            </group>
          )}
          <Octopus t={t} position={[0.95, 0, -0.6]} scale={0.62} armGlow={Array(8).fill(glow)} glowColor="#FFD23F" />
        </>
      );
    },
    tags: [{ text: 'Lengan 2/3', color: 'yellow', at: [1.7, 0.3, 0.4], delay: 0.8 }],
    overlay: ({ t }) => <BarPanel t={t} value={2 / 3} ticks={['0', '1/3', '2/3', '1']} label="SEL SARAF DALAM LENGAN" />,
  },
  /* 25 */ {
    chip: 'BUKAN DI KEPALA', anchor: [18, 0], env: 'studio',
    cam: cam([0, 0.9, 5.0], [0, 0.35, 0], [0, 1.9, 4.4], [0, 1.25, 0], 35, 0.05),
    world: ({ t }) => <Octopus t={t} xray={0.75} showHearts={false} brainGlow={pop(t, 0.5, 0.4)} armGlow={Array(8).fill(0.85)} glowColor="#FFD23F" />,
    tags: [{ text: 'Kepala 1/3', color: 'blue', at: [0, 0.95, 0.1], dx: 200, dy: -90, delay: 0.7 }],
  },
  /* 26 */ {
    chip: 'LENGAN FIKIR SENDIRI', anchor: [19, 0], env: 'seabed', decor: false,
    cam: cam([-0.6, 3.6, 8.4], [0, 1.0, 0], [0.6, 3.1, 7.5], [0, 1.0, 0]),
    world: ({ t }) => {
      const tip = (i: number) => toWorld(armTip(i, 'idle', jobsArm, t), [0, 0, 0], 0.8);
      const shellTip = tip(6);
      return (
        <>
          <Octopus t={t} arm={jobsArm} happy={t > 1.8} scale={0.8} />
          <Jar position={[1.8, 0, 0.75]} lid={easeOutCubic(prog(t, 0.6, 0.6))} />
          <Shell position={[shellTip[0], shellTip[1] - 0.05, shellTip[2]]} rotation={[0.4, 0.5, 0]} scale={1.2} />
          <Rock position={[-1.35, 0, -2.3]} s={1.3} seed={51} />
          <Seaweed position={[2.2, 0, -2.4]} t={t} h={8} />
          <Seaweed position={[-3.2, 0, -1.4]} t={t} h={6} seed={2} />
          {[1, 6, 2].map((i, k) => (
            <Thought key={i} at={tip(i)} t={t} delay={0.3 + k * 0.35} />
          ))}
        </>
      );
    },
    tags: [
      { text: 'Lengan 1: buka balang', color: 'yellow', at: [1.8, 1.4, 0.75], delay: 0.6, size: 38, dx: -60, dy: -50 },
      { text: 'Lengan 2: ambil kulit kerang', color: 'yellow', at: [-1.5, -0.2, 1.2], delay: 1.0, size: 38, rot: 3 },
    ],
  },
  /* 27 */ {
    chip: 'TIGA JANTUNG', anchor: [20, 0], env: 'studio',
    cam: cam([-2.8, 1.6, 7.0], [0, 1.3, 0], [-1.6, 1.8, 6.4], [0, 1.3, 0]),
    world: ({ t }) => (
      <>
        <Octopus t={t} scale={0.7} happy />
        {[0, 1, 2].map((i) => {
          const a = t * 2.4 + (i * Math.PI * 2) / 3;
          return <Heart key={i} t={t + i * 0.2} size={0.55} position={[Math.cos(a) * 1.55, 1.4 + Math.sin(a * 2) * 0.25, Math.sin(a) * 1.55]} rotation={[0, -a, 0]} />;
        })}
      </>
    ),
  },
  /* 28 */ {
    chip: 'DARAH BIRU', anchor: [20, 2], env: 'studio',
    cam: cam([0.8, 2.2, 4.8], [0, 1.6, 0], [0, 1.9, 4.0], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        <Drop position={[0, 1.5 + Math.sin(t * 3) * 0.08, 0]} rotation={[0, t * 3, 0.1]} scale={0.5 * pop(t, 0, 0.35)} color="#2F7BFF" glow={0.2} />
        {[[-1.1, 2.4, 0], [1.0, 1.9, 0.2], [0.7, 2.9, -0.2]].map((p, i) => (
          <Sparkle key={i} position={p as V3} s={0.3 * pop(t, 0.2 + i * 0.12)} color="#4CC9F0" rotation={[0, 0, t * 2]} />
        ))}
      </>
    ),
  },
  /* 29 */ {
    chip: 'LENGAN BERFIKIR', anchor: [20, 4], env: 'studio',
    cam: cam([3.6, 4.8, 6.2], [0, 1.0, 0], [2.6, 4.2, 5.6], [0, 1.0, 0]),
    world: ({ t }) => {
      const arm = (i: number) => ({ elev: -0.9 + 0.5 * Math.max(0, Math.sin(t * 5 + i * 1.3)), curl: 2.4 + Math.sin(t * 4 + i) * 0.8 });
      return (
        <>
          <Octopus t={t} arm={arm} armGlow={Array.from({ length: 8 }).map((_, i) => 0.6 + 0.4 * Math.sin(t * 6 + i))} glowColor="#FFD23F" />
          {[0, 3, 5].map((i, k) => (
            <Thought key={i} at={toWorld(armTip(i, 'idle', arm, t), [0, 0, 0])} t={t} delay={0.15 + k * 0.15} />
          ))}
        </>
      );
    },
  },
  /* 30 */ {
    chip: 'MACAM ALIEN', anchor: [21, 0], env: 'night',
    cam: cam([0, 2.6, 10.2], [0, 2.9, 0], [0.5, 3.0, 9.0], [0, 3.0, 0]),
    world: ({ t }) => {
      const up = easeInOut(prog(t, 0.2, 1.3));
      return (
        <>
          <UFO t={t} position={[0, 5.6 + Math.sin(t * 2) * 0.1, 0]} beam={pop(t, 0, 0.3)} rotation={[0.08, 0, 0]} />
          <Octopus
            t={t}
            scale={0.7}
            position={[0, lerp(0, 2.4, up), 0]}
            rotation={[0, t * 1.2, 0]}
            happy
            arm={(i) => (i === 1 || i === 7 ? { elev: 1.0, bend: -0.1, curl: Math.sin(t * 9 + i) * 0.8, ground: false, wave: 0.1 } : { ground: up < 0.05 })}
          />
          <pointLight position={[0, 3, 1.5]} intensity={14} color="#9DFFCF" distance={8} />
        </>
      );
    },
    tags: [{ text: 'Alien?', color: 'green', at: [1.6, 4.0, 0], delay: 0.45, size: 52 }],
  },
  /* 31 */ {
    chip: 'FOLLOW', anchor: [22, 0], env: 'studio',
    cam: cam([0, 2.0, 7.6], [0.1, 1.5, 0], [0.3, 1.9, 6.9], [0.1, 1.5, 0]),
    world: ({ t }) => {
      const press = Math.sin(clamp01((t - 0.85) / 0.25) * Math.PI);
      return (
        <>
          <AbangBlok t={t} pose="wave" position={[-1.0, 0, 0]} scale={0.9} rotation={[0, 0.3, 0]} />
          <group position={[0.75, 1.75, 0.4]} rotation={[0, -0.25, 0.05]} scale={[pop(t, 0.2, 0.4), pop(t, 0.2, 0.4) * (1 - press * 0.15), pop(t, 0.2, 0.4)]}>
            <TextCard text="+ Follow" bg="#FF5A36" fg="#FFFFFF" w={1.55} h={0.62} font={84} depth={0.3} radius={0.14} />
          </group>
          <Sparkle position={[1.4, 2.35, 0.4]} s={0.35 * pop(t, 1.0)} rotation={[0, 0, t * 3]} />
        </>
      );
    },
    tags: [{ text: 'Follow!', color: 'green', at: [0.8, 2.55, 0.4], delay: 0.55 }],
  },
  /* 32 */ {
    chip: 'ESOK: GELETEK', anchor: [23, 0], env: 'studio',
    cam: (t, d) => orbit([0, 2.1, 0], 7.0, 2.1, -0.25, 0.3, 35)(t, d),
    world: ({ t }) => {
      const enter = easeOutCubic(prog(t, 0.1, 0.9));
      const fx = lerp(4.5, 0.75, enter) + Math.sin(t * 9) * 0.12 * enter;
      const fy = lerp(4.0, 1.35, enter) + Math.sin(t * 13) * 0.15 * enter;
      return (
        <>
          <AbangBlok t={t} pose={t > 0.7 ? 'laugh' : 'idle'} position={[-0.25, 0, 0]} />
          <Feather position={[fx, fy, 0.55]} rotation={[0.2, 0, 0.9 + Math.sin(t * 10) * 0.3 * enter]} />
          {t > 0.8 && [0, 1, 2].map((i) => <Sparkle key={i} position={[-1.2 + i * 0.25, 2.9 + i * 0.25, 0.3]} s={0.25 * pop(t, 0.8 + i * 0.15)} rotation={[0, 0, t * 4]} />)}
        </>
      );
    },
    overlay: ({ t }) => <TeaserCard t={t} delay={0.9} badge="Esok" text="Kenapa tak boleh geletek diri sendiri?" />,
  },
];

if (scenes.length !== 32) throw new Error(`Expected 32 scenes, got ${scenes.length}`);

export const V01_SCENES = scenes;
export const V01_SotongKurita: React.FC = () => <VideoEngine scenes={scenes} data={DATA} audio="audio/v01_sotong_kurita.wav" />;

void bounceOut;
void C;
