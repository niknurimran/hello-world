import React from 'react';
import words from '../../data/v04_words.json';
import { SceneDef, VideoEngine } from '../components/VideoEngine';
import { WordsFile } from '../lib/timing';
import { dolly, orbit } from '../lib/camera';
import { backOut, clamp01, dropY, easeInOut, easeOutCubic, lerp, pop, prog, rand, V3 } from '../lib/easing';
import { AbangBlok } from '../objects/AbangBlok';
import { Atom, Bond, Bubble, Drop, Sparkle, TextCard } from '../objects/Props';
import { CheckMark, CrossX } from '../objects/Everyday';
import {
  Bacterium, Bee, Bowl, ClayPot, Dipper, Enzyme, HONEY, Honeycomb, HoneyJar, Hourglass, LemonSlice, LightBeam, Pyramid, Stone, Sun, WarningSign,
} from '../objects/Honey';
import { TeaserCard } from '../components/Panel';
import * as THREE from 'three';

const DATA = words as WordsFile;
export const V04_DURATION = DATA.duration;

const cam = (p0: V3, t0: V3, p1: V3, t1: V3, fov = 35, whip?: number) => dolly({ pos: p0, target: t0, fov }, { pos: p1, target: t1, fov }, { whip });

/** "#N" reason card with honey drop. */
const ReasonCard: React.FC<{ t: number; n: string; color: string }> = ({ t, n, color }) => (
  <>
    <group position={[0, 1.7 + dropY(t, 0, 0.45, 3), 0]} rotation={[0, Math.sin(t * 2) * 0.2, (1 - backOut(prog(t, 0, 0.5))) * 0.6]} scale={pop(t, 0, 0.35)}>
      <TextCard text={n} bg={color} fg="#16181D" w={1.6} h={1.6} font={250} depth={0.4} radius={0.2} />
    </group>
    <Drop position={[1.25, 0.55 + Math.sin(t * 3) * 0.06, 0.6]} scale={0.32 * pop(t, 0.3)} color={HONEY} rotation={[0, t, 0]} />
    <Sparkle position={[-1.1, 2.7, 0.4]} s={0.3 * pop(t, 0.4)} rotation={[0, 0, t * 3]} />
  </>
);

/** Tomb set: sandstone walls, pillars and a hieroglyph-ish band (abstract shapes only). */
const Tomb: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {Array.from({ length: 5 }).map((_, i) => (
      <Stone key={`w${i}`} size={[1.9, 4.6, 0.6]} position={[-3.8 + i * 1.95, 2.3, -2.6]} color={i % 2 ? '#C29254' : '#B98A4E'} />
    ))}
    {[-2.6, 2.6].map((x) => (
      <Stone key={x} size={[0.8, 4.4, 0.8]} position={[x, 2.2, -1.2]} color="#D3A766" />
    ))}
    {/* abstract glyph band */}
    {Array.from({ length: 9 }).map((_, i) => (
      <mesh key={`g${i}`} position={[-2.0 + i * 0.5, 3.2, -2.28]}>
        {i % 3 === 0 ? <circleGeometry args={[0.13, 16]} /> : i % 3 === 1 ? <planeGeometry args={[0.1, 0.36]} /> : <planeGeometry args={[0.28, 0.1]} />}
        <meshStandardMaterial color="#5A3A1E" roughness={0.9} />
      </mesh>
    ))}
    {/* wall torches */}
    {[-1.7, 1.7].map((x, i) => (
      <group key={`t${i}`} position={[x, 2.4, -2.2]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#5A3A1E" />
        </mesh>
        <mesh position={[0, 0.35 + Math.sin(t * 13 + i) * 0.03, 0]} scale={[1, 1.4 + Math.sin(t * 17 + i) * 0.2, 1]}>
          <sphereGeometry args={[0.13, 12, 10]} />
          <meshBasicMaterial color="#FFB547" />
        </mesh>
        <pointLight position={[0, 0.5, 0.4]} intensity={14} color="#FFB060" distance={7} />
      </group>
    ))}
  </group>
);

const scenes: SceneDef[] = [
  /* 1 */ {
    chip: 'AHLI ARKEOLOGI', anchor: [0, 0], env: 'tomb',
    cam: cam([0, 2.2, 8.0], [0, 1.5, 0], [0.5, 2.0, 7.0], [0, 1.5, 0], 35, 0),
    world: ({ t }) => (
      <>
        <Tomb t={t} />
        <AbangBlok t={t} pose="point" hat position={[lerp(-1.6, -0.6, easeOutCubic(prog(t, 0, 1.2))), 0, 0.3]} rotation={[0, 0.5, 0]} />
        <Stone size={[1.2, 0.9, 1.0]} position={[1.0, 0.45, -0.4]} color="#A97F49" />
        <ClayPot position={[1.0, 0.9, -0.4]} scale={0.55} dusty />
        <pointLight position={[0.5, 2.5, 2]} intensity={10} color="#FFC890" distance={8} />
      </>
    ),
    tags: [{ text: 'Ahli arkeologi', color: 'green', at: [-0.8, 3.0, 0.3], delay: 0.4 }],
  },
  /* 2 */ {
    chip: 'MAKAM MESIR PURBA', anchor: [1, 0], env: 'tomb',
    cam: cam([1.2, 2.3, 6.4], [0, 1.3, 0], [0.2, 2.0, 5.6], [0, 1.3, 0]),
    world: ({ t }) => (
      <>
        <Tomb t={t} />
        <Stone size={[1.8, 0.5, 1.4]} position={[0, 0.25, 0]} color="#A97F49" />
        <ClayPot position={[0, 0.5, 0]} scale={0.8} dusty rotation={[0, t * 0.3, 0]} />
        <pointLight position={[0.8, 2.4, 1.5]} intensity={12} color="#FFC890" distance={6} />
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[(rand(i) - 0.5) * 2, 0.6 + ((t * 0.3 + rand(i + 3) * 2) % 2), (rand(i + 5) - 0.5) * 1.5]}>
            <sphereGeometry args={[0.025, 6, 5]} />
            <meshBasicMaterial color="#FFE0B0" />
          </mesh>
        ))}
      </>
    ),
    tags: [{ text: 'Balang madu', color: 'yellow', at: [0, 2.15, 0], dx: 160, delay: 0.35 }],
  },
  /* 3 */ {
    chip: 'BERIBU TAHUN', anchor: [2, 0], env: 'desert',
    cam: cam([0, 2.2, 8.2], [0, 1.4, 0], [0.6, 2.0, 7.2], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <Pyramid position={[-2.6, 0, -5]} scale={2.0} />
        <Pyramid position={[1.8, 0, -7]} scale={2.6} color="#D9AE62" />
        <Pyramid position={[3.4, 0, -3.6]} scale={1.2} />
        <Hourglass t={t} position={[0, dropY(t, 0, 0.45, 3), 0.5]} rotation={[0, 0.3 + t * 0.3, 0]} flow={3} />
      </>
    ),
    tags: [{ text: 'Beribu tahun', color: 'yellow', at: [0, 2.6, 0.5], dx: 120, delay: 0.5 }],
  },
  /* 4 */ {
    chip: 'BELUM BASI!', anchor: [3, 0], env: 'tomb',
    cam: cam([0, 2.6, 6.6], [0, 1.6, 0], [0.5, 2.4, 5.8], [0, 1.7, 0]),
    world: ({ t }) => {
      const open = easeOutCubic(prog(t, 0.2, 0.5));
      const dip = easeInOut(prog(t, 0.8, 0.7));
      return (
        <>
          <Tomb t={t} />
          <ClayPot position={[0, 0, 0]} open={open} glow={open} />
          <group position={[0.15, 1.35 + dip * 0.7, 0.1]} rotation={[0, 0, 0.25]} scale={0.7}>
            <Dipper />
          </group>
          {dip > 0.5 && <Drop position={[0.12, 1.25 + dip * 0.5 - ((t * 1.5) % 0.6), 0.1]} scale={0.08} color={HONEY} />}
          <CheckMark position={[0.95, 2.4, 0.3]} scale={0.45 * pop(t, 1.3, 0.3)} />
        </>
      );
    },
    tags: [{ text: 'Belum basi!', color: 'green', at: [-0.9, 2.2, 0.3], delay: 1.2, size: 52 }],
  },
  /* 5 */ {
    chip: 'SEBAB PERTAMA', anchor: [4, 0], env: 'studio',
    cam: cam([0, 2.0, 7.0], [0, 1.6, 0], [0.4, 1.9, 6.2], [0, 1.6, 0]),
    world: ({ t }) => <ReasonCard t={t} n="#1" color="#4CC9F0" />,
  },
  /* 6 */ {
    chip: 'KURANG AIR', anchor: [4, 2], env: 'studio',
    cam: cam([-0.8, 2.3, 6.6], [0, 1.3, 0], [0, 2.1, 5.8], [0, 1.3, 0]),
    world: ({ t }) => (
      <>
        <HoneyJar position={[0, 0, 0]} level={0.8} lid={0} t={t} scale={pop(t, 0, 0.35)} />
        {[[-0.25, 0], [0.2, 0.4], [0.05, 0.8]].map(([x, d], i) => {
          const k = prog(t, 0.4 + d, 1.0);
          return k > 0 && k < 1 ? <Drop key={i} position={[x, 1.3 + k * 1.6, 0.1]} scale={0.12 * (1 - k * 0.6)} color="#4CC9F0" /> : null;
        })}
      </>
    ),
    tags: [{ text: 'Kurang air', color: 'blue', at: [0.7, 2.4, 0], delay: 0.5 }],
  },
  /* 7 */ {
    chip: 'BAKTERIA PERLU AIR', anchor: [5, 0], env: 'studio',
    cam: cam([0, 3.8, 7.8], [0, 0.6, 0], [0.5, 3.4, 7.0], [0, 0.6, 0]),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.6, 48]} />
          <meshStandardMaterial color="#6FD0F5" roughness={0.1} transparent opacity={0.85} emissive="#4CC9F0" emissiveIntensity={0.15} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = t * 0.9 + (i * Math.PI * 2) / 3;
          return <Bacterium key={i} t={t + i} position={[Math.cos(a) * 1.0, 0.4 + Math.sin(t * 3 + i) * 0.08, Math.sin(a) * 0.8]} rotation={[0, -a + Math.PI / 2, 0]} scale={0.8 * pop(t, i * 0.15, 0.3)} />;
        })}
      </>
    ),
    tags: [{ text: 'Bakteria', color: 'red', at: [0, 1.4, 0], dx: 170, delay: 0.4 }],
  },
  /* 8 */ {
    chip: 'DALAM MADU', anchor: [6, 0], env: 'studio',
    cam: cam([0.6, 2.8, 6.0], [0, 0.7, 0], [0, 2.5, 5.2], [0, 0.7, 0]),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.05, 0]} scale={[1, 0.08, 1]} receiveShadow>
          <sphereGeometry args={[1.9, 48, 24]} />
          <meshStandardMaterial color={HONEY} roughness={0.15} emissive={HONEY} emissiveIntensity={0.2} />
        </mesh>
        <Bacterium t={t} mood="scared" dry={easeInOut(prog(t, 0.6, 1.0)) * 0.6} position={[0, Math.max(0.35, 2.4 - t * 3), 0.2]} scale={0.95} rotation={[0, 0.2, 0]} />
      </>
    ),
    tags: [{ text: 'Madu', color: 'yellow', at: [1.3, 0.3, 0.5], delay: 0.3 }],
  },
  /* 9 */ {
    chip: '“KERING” DAN MATI', anchor: [6, 4], env: 'studio',
    cam: cam([-0.6, 2.2, 5.0], [0, 0.8, 0], [0, 2.0, 4.4], [0, 0.8, 0]),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.05, 0]} scale={[1, 0.08, 1]} receiveShadow>
          <sphereGeometry args={[1.9, 48, 24]} />
          <meshStandardMaterial color={HONEY} roughness={0.15} emissive={HONEY} emissiveIntensity={0.2} />
        </mesh>
        <Bacterium t={t} mood={t > 0.7 ? 'dead' : 'sour'} dry={0.6 + 0.4 * easeOutCubic(prog(t, 0, 0.7))} position={[0, 0.35, 0.2]} rotation={[0, 0.2, t > 0.7 ? 0.3 : 0]} />
      </>
    ),
    tags: [
      { text: 'Kering!', color: 'yellow', at: [-0.7, 1.2, 0.2], delay: 0.15 },
      { text: 'Mati', color: 'red', at: [0.7, 1.0, 0.2], delay: 0.8 },
    ],
  },
  /* 10 */ {
    chip: 'SEBAB KEDUA', anchor: [7, 0], env: 'studio',
    cam: cam([0.6, 2.0, 7.0], [0, 1.6, 0], [0, 1.9, 6.2], [0, 1.6, 0]),
    world: ({ t }) => <ReasonCard t={t} n="#2" color="#FFD23F" />,
  },
  /* 11 */ {
    chip: 'BERASID', anchor: [7, 2], env: 'studio',
    cam: cam([0, 2.2, 6.4], [0, 1.2, 0], [0.5, 2.0, 5.6], [0, 1.2, 0]),
    world: ({ t }) => (
      <>
        <HoneyJar position={[-0.45, 0, 0]} level={0.8} lid={0} t={t} />
        <LemonSlice position={[0.85, 0.55 + dropY(t, 0.2, 0.4, 2), 0.4]} rotation={[0, -0.4, 0.1]} scale={0.9 * pop(t, 0.2, 0.3)} />
        <LemonSlice position={[1.0, 1.35 + dropY(t, 0.4, 0.4, 2), 0.1]} rotation={[0.3, -0.6, -0.2]} scale={0.7 * pop(t, 0.4, 0.3)} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Bubble key={i} position={[-0.45 + (rand(i) - 0.5) * 0.7, 1.3 + ((t * 0.7 + i * 0.3) % 1.2), 0.2]} r={0.05} />
        ))}
      </>
    ),
    tags: [{ text: 'Berasid', color: 'yellow', at: [-0.45, 2.1, 0], delay: 0.5, size: 52 }],
  },
  /* 12 */ {
    chip: 'TAK SUKA MASAM', anchor: [8, 0], env: 'studio',
    cam: cam([0, 2.1, 7.6], [0, 1.1, 0], [-0.5, 2.0, 6.8], [0, 1.1, 0]),
    world: ({ t }) => (
      <>
        <LemonSlice position={[-0.8, 0.5, 0]} rotation={[0, 0.4, 0]} scale={0.85} />
        {[0, 1].map((i) => (
          <Bacterium key={i} t={t + i} mood="sour" position={[lerp(0.2, 0.75, easeOutCubic(prog(t, 0.3 + i * 0.2, 1.0))), 0.6 + i * 0.9, 0.3 - i * 0.4]} rotation={[0, Math.PI, 0]} scale={0.85} />
        ))}
      </>
    ),
    tags: [{ text: 'Masam!', color: 'yellow', at: [-0.9, 1.4, 0], delay: 0.4, size: 52 }],
  },
  /* 13 */ {
    chip: 'SEBAB KETIGA', anchor: [9, 0], env: 'studio',
    cam: cam([0, 2.0, 7.0], [0, 1.6, 0], [-0.4, 1.9, 6.2], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        <ReasonCard t={t} n="#3" color="#3DDC84" />
        <Bee t={t} position={[lerp(-2.0, 0.9, prog(t, 0.2, 1.1)), 2.75 + Math.sin(t * 6) * 0.12, 0.6]} scale={0.6} />
      </>
    ),
  },
  /* 14 */ {
    chip: 'LEBAH TAMBAH ENZIM', anchor: [9, 2], env: 'studio',
    cam: cam([0.8, 2.2, 6.6], [0, 1.6, 0], [0, 2.1, 5.8], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        <Honeycomb position={[0, 1.2, -0.3]} fill={0.75} glow={0.15} scale={0.72 * pop(t, 0, 0.35)} />
        <Bee t={t} position={[Math.sin(t * 1.5) * 0.6, 2.45 + Math.sin(t * 6) * 0.1, 0.6]} rotation={[0, Math.cos(t * 1.5) > 0 ? 0 : Math.PI, 0]} scale={0.8} />
        {Array.from({ length: 8 }).map((_, i) => {
          const k = ((t * 0.8 + i / 8) % 1 + 1) % 1;
          return (
            <mesh key={i} position={[Math.sin((t - k) * 1.5) * 0.6 + (rand(i) - 0.5) * 0.2, 2.25 - k * 1.0, 0.5]} scale={(1 - k) * 0.09}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#3DDC84" emissive="#3DDC84" emissiveIntensity={0.8} />
            </mesh>
          );
        })}
      </>
    ),
    tags: [{ text: 'Enzim', color: 'green', at: [0.9, 2.2, 0.5], delay: 0.6 }],
  },
  /* 15 */ {
    chip: 'ENZIM HASILKAN...', anchor: [10, 0], env: 'macro',
    cam: cam([0, 1.9, 6.6], [0, 1.6, 0], [0.4, 1.8, 5.8], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        {[[-0.6, 2.0, 0], [0.55, 1.3, 0.3]].map((p, i) => (
          <Enzyme key={i} t={t + i} position={p as V3} rotation={[0, i ? -0.4 : 0.4, 0]} scale={0.7 * pop(t, i * 0.2, 0.3)} color="#3DDC84" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const k = ((t * 0.7 + i / 10) % 1 + 1) % 1;
          return <Bubble key={i} position={[(i % 2 ? 0.55 : -0.6) + (rand(i) - 0.3) * 0.5, (i % 2 ? 1.5 : 2.2) + k * 1.2, 0.4]} r={0.05 + rand(i) * 0.05} />;
        })}
      </>
    ),
    tags: [{ text: 'Sedikit', color: 'blue', at: [0.4, 2.8, 0.3], delay: 0.8 }],
  },
  /* 16 */ {
    chip: 'HIDROGEN PEROKSIDA', anchor: [10, 4], env: 'darklab',
    cam: cam([0, 2.6, 6.4], [0, 2.0, 0], [0.5, 2.4, 5.4], [0, 2.0, 0]),
    world: ({ t }) => {
      const nodes: V3[] = [[-1.0, 0.45, 0], [-0.35, 0, 0], [0.35, 0, 0], [1.0, -0.45, 0]];
      return (
        <>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.3, 1.5, 0.6, 48]} />
            <meshStandardMaterial color="#3A4150" roughness={0.6} />
          </mesh>
          <group position={[0, 2.1, 0]} rotation={[0.25, 0.35 * Math.sin(t * 1.6), 0.15]} scale={pop(t, 0, 0.4)}>
            {nodes.slice(0, 3).map((p, i) => (
              <Bond key={i} a={new THREE.Vector3(...p)} b={new THREE.Vector3(...nodes[i + 1])} r={0.08} />
            ))}
            {nodes.map((p, i) => (
              <Atom key={i} position={p} r={i === 0 || i === 3 ? 0.24 : 0.38} color={i === 0 || i === 3 ? '#F3F4F7' : '#EF4444'} glow={0.15} />
            ))}
          </group>
        </>
      );
    },
    tags: [{ text: 'H₂O₂', color: 'blue', at: [0, 3.2, 0], delay: 0.45, size: 52 }],
  },
  /* 17 */ {
    chip: 'PEMBUNUH KUMAN', anchor: [11, 0], env: 'studio',
    cam: cam([0, 2.2, 6.8], [0, 1.2, 0], [0.5, 2.0, 6.0], [0, 1.2, 0]),
    world: ({ t }) => (
      <>
        {[[-0.9, 0.9, 0], [0.2, 1.6, -0.3], [0.9, 0.7, 0.3]].map((p, i) => {
          const hit = t > 0.6 + i * 0.4;
          const k = prog(t, 0.6 + i * 0.4, 0.4);
          return (
            <group key={i}>
              <Bacterium t={t + i} mood={hit ? 'dead' : 'scared'} dry={hit ? 0.5 : 0} position={p as V3} scale={0.8 * (hit ? 1 - k * 0.3 : 1)} rotation={[0, 0, hit ? 0.4 : 0]} />
              {k > 0 && k < 1 && (
                <mesh position={p as V3} scale={0.3 + k * 1.2}>
                  <ringGeometry args={[0.4, 0.5, 32]} />
                  <meshBasicMaterial color="#4CC9F0" transparent opacity={1 - k} depthWrite={false} />
                </mesh>
              )}
            </group>
          );
        })}
        {Array.from({ length: 8 }).map((_, i) => (
          <Bubble key={i} position={[(rand(i) - 0.5) * 2.6, 0.3 + ((t * 0.8 + rand(i + 2) * 2) % 2.4), 0.5]} r={0.06} />
        ))}
      </>
    ),
    tags: [{ text: 'Pembunuh kuman', color: 'red', at: [0, 2.6, 0], delay: 0.4 }],
  },
  /* 18 */ {
    chip: 'ADA SYARAT', anchor: [12, 0], env: 'studio',
    cam: cam([0, 2.0, 7.0], [0, 1.6, 0], [0.4, 2.0, 6.2], [0, 1.6, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="oneFinger" position={[-0.8, 0, 0]} rotation={[0, 0.3, 0]} />
        <WarningSign position={[0.7, 1.9 + dropY(t, 0.1, 0.4, 3), 0.3]} scale={0.6 * pop(t, 0.1, 0.3)} rotation={[0, -0.3, Math.sin(t * 6) * 0.05]} />
      </>
    ),
    tags: [{ text: 'Syarat!', color: 'yellow', at: [0.7, 0.9, 0.3], delay: 0.4 }],
  },
  /* 19 */ {
    chip: 'TUTUP RAPAT', anchor: [12, 3], env: 'studio',
    cam: cam([0.6, 2.6, 5.4], [0, 1.3, 0], [0, 2.4, 4.6], [0, 1.4, 0]),
    world: ({ t }) => <HoneyJar position={[0, 0, 0]} level={0.8} lid={easeInOut(prog(t, 0.1, 1.0))} t={t} rotation={[0, t * 0.4, 0]} />,
    tags: [{ text: 'Tutup rapat', color: 'green', at: [0, 1.8, 0], dx: 210, delay: 1.0 }],
  },
  /* 20 */ {
    chip: 'SERAP AIR DARI UDARA', anchor: [13, 0], env: 'studio',
    cam: cam([-0.6, 2.4, 6.4], [0, 1.4, 0], [0.2, 2.2, 5.6], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <HoneyJar position={[0, 0, 0]} level={0.8} lid={0} t={t} />
        {Array.from({ length: 9 }).map((_, i) => {
          const k = ((t * 0.5 + i / 9) % 1 + 1) % 1;
          const from: V3 = [(rand(i) - 0.5) * 3, 3.2 + rand(i + 3), 0.5];
          return <Drop key={i} position={[lerp(from[0], (rand(i + 5) - 0.5) * 0.6, k), lerp(from[1], 1.3, k), 0.2]} scale={0.09} color="#4CC9F0" />;
        })}
      </>
    ),
    tags: [{ text: 'Air dari udara', color: 'blue', at: [0, 3.3, 0.5], delay: 0.5 }],
  },
  /* 21 */ {
    chip: 'BOLEH ROSAK', anchor: [13, 6], env: 'studio',
    cam: cam([0.5, 2.0, 5.8], [0, 1.2, 0], [0, 1.9, 5.0], [0, 1.2, 0]),
    world: ({ t }) => (
      <>
        <HoneyJar position={[-0.3, 0, 0]} level={0.8} lid={0} murky={easeOutCubic(prog(t, 0, 0.6))} t={t} />
        <CrossX position={[0.75, 1.8 + dropY(t, 0.4, 0.35, 2), 0.4]} scale={0.4 * pop(t, 0.4, 0.25)} />
      </>
    ),
    tags: [{ text: 'Rosak', color: 'red', at: [0.75, 0.7, 0.4], delay: 0.5, size: 52 }],
  },
  /* 22 */ {
    chip: 'BERKETUL / BERKRISTAL', anchor: [14, 0], env: 'studio',
    cam: orbit([0, 1.0, 0], 5.2, 2.2, -0.5, 0.4, 35),
    world: ({ t }) => <HoneyJar position={[0, 0, 0]} level={0.8} crystals={easeOutCubic(prog(t, 0.2, 1.0))} color="#F2B94A" t={t} />,
    tags: [{ text: 'Berkristal', color: 'yellow', at: [0, 1.6, 0], dx: 200, delay: 0.7 }],
  },
  /* 23 */ {
    chip: 'ITU NORMAL', anchor: [14, 6], env: 'studio',
    cam: cam([0, 2.0, 7.0], [0, 1.4, 0], [0.4, 1.9, 6.2], [0, 1.4, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="present" position={[-0.9, 0, 0]} rotation={[0, 0.35, 0]} />
        <HoneyJar position={[0.75, 0, 0.2]} level={0.8} crystals={1} color="#F2B94A" t={t} scale={0.75} />
        <CheckMark position={[0.75, 2.2, 0.4]} scale={0.5 * pop(t, 0.15, 0.3)} />
      </>
    ),
    tags: [{ text: 'Normal', color: 'green', at: [0.75, 2.95, 0.4], delay: 0.35, size: 52 }],
  },
  /* 24 */ {
    chip: 'RENDAM AIR SUAM', anchor: [15, 0], env: 'studio',
    cam: cam([0, 3.2, 6.2], [0, 1.0, 0], [0.5, 2.9, 5.4], [0, 1.0, 0]),
    world: ({ t }) => (
      <>
        <Bowl t={t} position={[0, 0, 0]} />
        <HoneyJar position={[0, 0.05 + dropY(t, 0, 0.5, 2.5), 0]} level={0.8} crystals={1} color="#F2B94A" t={t} scale={0.7} />
      </>
    ),
    tags: [{ text: 'Air suam', color: 'blue', at: [1.0, 0.6, 0.8], delay: 0.5 }],
  },
  /* 25 */ {
    chip: 'CAIR BALIK', anchor: [15, 5], env: 'studio',
    cam: cam([-0.6, 2.2, 4.8], [0, 1.0, 0], [0, 2.0, 4.2], [0, 1.0, 0]),
    world: ({ t }) => {
      const melt = easeInOut(prog(t, 0.1, 1.1));
      return (
        <>
          <Bowl t={t} position={[0, 0, 0]} steam={0.6} />
          <HoneyJar position={[0, 0.05, 0]} level={0.8} crystals={1 - melt} color={`#${new THREE.Color('#F2B94A').lerp(new THREE.Color(HONEY), melt).getHexString()}`} t={t} scale={0.7} />
          <Sparkle position={[0.7, 1.8, 0.4]} s={0.3 * pop(t, 1.0)} rotation={[0, 0, t * 3]} />
        </>
      );
    },
    tags: [{ text: 'Cair balik', color: 'green', at: [0, 1.6, 0], dx: 190, delay: 0.8 }],
  },
  /* 26 */ {
    chip: 'LEBIH LAMA DARI TAMADUN', anchor: [16, 0], env: 'desert',
    cam: orbit([0, 1.6, 0], 8.0, 2.4, -0.4, 0.35, 35),
    world: ({ t }) => (
      <>
        <Pyramid position={[-2.4, 0, -3.5]} scale={1.7} />
        <Pyramid position={[1.9, 0, -4.5]} scale={2.2} color="#D9AE62" />
        <Pyramid position={[3.2, 0, -1.5]} scale={0.9} />
        <ClayPot position={[0, 0, 0.5]} scale={1.05 * pop(t, 0, 0.45)} glow={0.6} open={0} />
        {[[-1.0, 2.4, 0.8], [1.0, 2.0, 0.8], [0.6, 2.9, 0.6]].map((p, i) => (
          <Sparkle key={i} position={p as V3} s={0.3 * pop(t, 0.4 + i * 0.15)} rotation={[0, 0, t * 3]} />
        ))}
      </>
    ),
    tags: [{ text: 'Lebih lama dari tamadun', color: 'yellow', at: [0, 2.7, 0.5], delay: 1.2, size: 40 }],
  },
  /* 27 */ {
    chip: 'ESOK: MATAHARI', anchor: [17, 0], env: 'space',
    cam: cam([0, 2.4, 9.0], [0, 2.4, 0], [0.4, 2.4, 7.8], [0, 2.4, 0]),
    world: ({ t }) => <Sun t={t} position={[0, 2.3, 0]} scale={0.62 * backOut(prog(t, 0, 0.5))} />,
    tags: [{ text: 'Esok', color: 'yellow', at: [1.3, 3.6, 0], delay: 0.3, size: 52 }],
  },
  /* 28 */ {
    chip: 'MASA LALU?', anchor: [18, 0], env: 'space',
    cam: cam([0, 2.4, 9.4], [0, 2.2, 0], [0.4, 2.3, 8.6], [0, 2.2, 0]),
    world: ({ t }) => (
      <>
        <Sun t={t} position={[-0.75, 2.2, -1]} scale={0.5} />
        <AbangBlok t={t} pose="point" side={-1} position={[0.6, 0, 0.5]} rotation={[0, -0.6, 0]} scale={0.6} />
        <LightBeam from={[-0.3, 2.1, -0.8]} to={[0.6, 1.2, 0.6]} t={t} />
        <Hourglass t={t} position={[-0.75, 0.0, 0.9]} scale={0.4} rotation={[0, 0.4, 0]} flow={3} />
      </>
    ),
    tags: [{ text: 'Masa lalu?', color: 'blue', at: [0.6, 0.2, 0.5], delay: 0.5 }],
    overlay: ({ t }) => <TeaserCard t={t} delay={1.1} badge="Esok" text="Tengok matahari = tengok masa lalu?" />,
  },
];

if (scenes.length !== 28) throw new Error(`Expected 28 scenes, got ${scenes.length}`);

export const V04_SCENES = scenes;
export const V04_Madu: React.FC = () => <VideoEngine scenes={scenes} data={DATA} audio="audio/v04_madu.mp3" />;
void clamp01;
