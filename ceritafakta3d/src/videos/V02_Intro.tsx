import React from 'react';
import { RoundedBox } from '@react-three/drei';
import words from '../../data/v02_words.json';
import { SceneDef, VideoEngine } from '../components/VideoEngine';
import { WordsFile } from '../lib/timing';
import { dolly, orbit } from '../lib/camera';
import { backOut, clamp01, dropY, easeInOut, easeOutCubic, lerp, pop, prog, rand, V3 } from '../lib/easing';
import { C } from '../lib/theme';
import { AbangBlok } from '../objects/AbangBlok';
import { Heart } from '../objects/Heart';
import { Octopus } from '../objects/Octopus';
import { BloodTube, Bubble, Crab, QMark, Shell, Sparkle, TextCard } from '../objects/Props';
import {
  AlarmClock, Bulb, Calendar, CheckMark, CrossX, Dice, FloorLamp, Moon, Mug, Planet, ProfileCard, Rocket, RoomCorner, Sofa,
  SpeechBubble, TVSet, WireCube,
} from '../objects/Everyday';
import { Rock, Seaweed } from '../envs/Env';

const DATA = words as WordsFile;
export const V02_DURATION = DATA.duration;

const cam = (p0: V3, t0: V3, p1: V3, t1: V3, fov = 35, whip?: number) => dolly({ pos: p0, target: t0, fov }, { pos: p1, target: t1, fov }, { whip });

/** Small blocky avatar head (Abang Blok) for the profile card. */
const AvatarHead: React.FC<{ position: V3; s?: number }> = ({ position, s = 1 }) => (
  <group position={position} scale={s}>
    <RoundedBox args={[0.62, 0.62, 0.62]} radius={0.06}>
      <meshStandardMaterial color={C.skin} roughness={0.6} />
    </RoundedBox>
    <RoundedBox args={[0.66, 0.16, 0.66]} radius={0.05} position={[0, 0.28, -0.01]}>
      <meshStandardMaterial color={C.hair} roughness={0.6} />
    </RoundedBox>
    {[-1, 1].map((sx) => (
      <mesh key={sx} position={[sx * 0.14, 0.06, 0.315]}>
        <boxGeometry args={[0.075, 0.11, 0.01]} />
        <meshStandardMaterial color="#14161A" />
      </mesh>
    ))}
    <mesh position={[0, -0.12, 0.315]}>
      <boxGeometry args={[0.22, 0.06, 0.01]} />
      <meshStandardMaterial color="#6B3A2A" />
    </mesh>
  </group>
);

const Confetti: React.FC<{ t: number; n?: number; from?: number }> = ({ t, n = 40, from = 0 }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => {
      const k = t - from;
      if (k < 0) return null;
      const x = (rand(i) - 0.5) * 6;
      const y = 5.5 - ((k * (1.2 + rand(i + 3)) + rand(i + 5) * 2) % 6);
      const cols = [C.yellow, C.green, C.blue, C.red, C.pink];
      return (
        <mesh key={i} position={[x + Math.sin(k * 3 + i) * 0.2, y, (rand(i + 9) - 0.5) * 2]} rotation={[k * 4 + i, k * 3, i]}>
          <boxGeometry args={[0.14, 0.06, 0.01]} />
          <meshStandardMaterial color={cols[i % cols.length]} />
        </mesh>
      );
    })}
  </group>
);

const scenes: SceneDef[] = [
  /* 1 */ {
    chip: 'KAU TAHU TAK?', anchor: [0, 0], env: 'studio',
    cam: cam([0, 2.0, 8.2], [0, 1.5, 0], [0, 1.9, 6.6], [0, 1.6, 0], 35, 0),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose={t < 0.7 ? 'shocked' : 'point'} side={-1} position={[-0.3, dropY(t, 0, 0.5, 4), 0]} rotation={[0, 0.15, 0]} />
        <QMark position={[0.75, 2.85, 0.3]} scale={1.1 * pop(t, 0.45)} />
        <QMark position={[1.2, 2.2, 0.1]} scale={0.6 * pop(t, 0.7)} color="#FFFFFF" />
      </>
    ),
    tags: [{ text: 'Kau tahu tak?', color: 'black', at: [-1.0, 2.6, 0], delay: 0.9, rot: -5 }],
  },
  /* 2 */ {
    chip: 'BENDA HARI-HARI', anchor: [0, 6], env: 'studio',
    cam: cam([0.6, 2.4, 8.0], [0, 0.9, 0], [-0.4, 2.2, 7.2], [0, 0.9, 0]),
    world: ({ t }) => (
      <>
        <Mug position={[-1.35, dropY(t, 0.0, 0.45, 5), 0.3]} rotation={[0, 0.5, 0]} color="#4CC9F0" />
        <AlarmClock t={t} ring={t > 0.6 ? 1 : 0} position={[0, dropY(t, 0.18, 0.45, 5), -0.2]} />
        <Bulb position={[1.35, dropY(t, 0.36, 0.45, 5), 0.3]} on={0} />
      </>
    ),
    tags: [{ text: 'Hari-hari', color: 'yellow', at: [0, 2.0, -0.2], delay: 0.7 }],
  },
  /* 3 */ {
    chip: 'ADA CERITA?', anchor: [1, 0], env: 'darklab',
    cam: cam([-2.2, 2.8, 8.4], [0, 1.2, 0], [-1.0, 2.5, 7.6], [0, 1.2, 0]),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.9, 2.1, 0.4, 48]} />
          <meshStandardMaterial color="#3A4150" roughness={0.6} />
        </mesh>
        <group rotation={[0, t * 0.5, 0]} position={[0, 0.4, 0]}>
          <Mug position={[-1.0, 0, 0.45]} rotation={[0, 0.5, 0]} color="#4CC9F0" scale={0.8} />
          <AlarmClock t={t} position={[0, 0, -0.5]} scale={0.8} />
          <Bulb position={[1.0, 0, 0.45]} on={0.2} scale={0.8} />
        </group>
        {[[-1.0, 1.9, 0.6], [0.15, 2.3, -0.3], [1.1, 2.25, 0.6]].map((p, i) => (
          <QMark key={i} position={p as V3} scale={0.75 * pop(t, 0.25 + i * 0.25)} color={i === 1 ? '#FFFFFF' : C.yellow} />
        ))}
      </>
    ),
    tags: [{ text: 'Tak pernah dengar?', color: 'black', at: [0, 3.2, 0], delay: 1.0 }],
  },
  /* 4 */ {
    chip: 'AKAUN NI', anchor: [2, 0], env: 'studio',
    cam: cam([0.8, 2.6, 7.6], [0, 2.1, 0], [0, 2.4, 6.6], [0, 2.1, 0], 35, 0.2),
    world: ({ t }) => {
      const s = backOut(prog(t, 0, 0.45));
      return (
        <group position={[0, 2.1 + Math.sin(t * 2) * 0.05, 0]} rotation={[0, (1 - s) * 1.2 + Math.sin(t) * 0.08, 0]} scale={s}>
          <group scale={0.72}>
            <ProfileCard handle="@ceritafakta3d" name="Cerita Fakta 3D" />
            <AvatarHead position={[-1.29, 0.34, 0.45]} s={0.55} />
          </group>
        </group>
      );
    },
    tags: [{ text: '@ceritafakta3d', color: 'green', at: [0.6, 3.6, 0], delay: 0.5 }],
  },
  /* 5 */ {
    chip: 'SETIAP HARI', anchor: [2, 3], env: 'studio',
    cam: cam([-1.6, 2.2, 7.0], [0, 1.3, 0], [-0.6, 2.0, 6.2], [0, 1.3, 0]),
    world: ({ t }) => (
      <>
        <Calendar page={clamp01((t - 0.2) / 1.2) * 4} labels={['1', '2', '3', '4', '5']} position={[0.45, pop(t, 0, 0.35) * 0 + 0.15, 0]} scale={pop(t, 0, 0.35)} rotation={[0, -0.2, 0]} />
        <AbangBlok t={t} pose="point" position={[-1.35, 0, 0.5]} rotation={[0, 0.45, 0]} scale={0.7} />
      </>
    ),
    tags: [{ text: 'Setiap hari', color: 'yellow', at: [1.0, 2.4, 0], delay: 0.45 }],
  },
  /* 6 */ {
    chip: 'SATU FAKTA MENARIK', anchor: [2, 7], env: 'studio',
    cam: cam([0, 2.0, 7.4], [0, 1.6, 0], [0.5, 2.1, 6.4], [0, 1.6, 0]),
    world: ({ t }) => {
      const on = easeOutCubic(prog(t, 0.3, 0.3));
      return (
        <>
          <AbangBlok t={t} pose="oneFinger" position={[-1.05, 0, 0]} rotation={[0, 0.3, 0]} />
          <Bulb position={[0.8, dropY(t, 0, 0.4, 3) + 0.1, 0]} scale={1.05} on={on} />
          {[[0.1, 2.6, 0.3], [1.6, 2.5, 0.3], [0.85, 3.1, 0.2]].map((p, i) => (
            <Sparkle key={i} position={p as V3} s={0.4 * pop(t, 0.4 + i * 0.1)} rotation={[0, 0, t * 3]} />
          ))}
        </>
      );
    },
    tags: [{ text: '1 fakta menarik', color: 'green', at: [0.8, 0.35, 0.5], delay: 0.5 }],
  },
  /* 7 */ {
    chip: 'BUKAN CAKAP KOSONG', anchor: [3, 0], env: 'studio',
    cam: cam([0, 2.6, 7.4], [0, 1.9, 0], [-0.4, 2.4, 6.6], [0, 1.9, 0]),
    world: ({ t }) => (
      <>
        <SpeechBubble t={t} position={[0, 2.2, 0]} scale={pop(t, 0, 0.35)} rotation={[0, 0.15, 0]} />
        <CrossX position={[0, 2.2 + dropY(t, 0.55, 0.4, 3), 0.5]} scale={pop(t, 0.55, 0.3) * 0.75} />
        <AbangBlok t={t} pose={t > 0.6 ? 'shocked' : 'idle'} position={[1.3, 0, -0.6]} rotation={[0, -0.4, 0]} scale={0.7} />
      </>
    ),
    tags: [{ text: 'Bukan cakap kosong', color: 'red', at: [-0.3, 0.6, 0.5], delay: 0.75 }],
  },
  /* 8 */ {
    chip: 'BENTUK 3D', anchor: [4, 0], env: 'studio',
    cam: orbit([0, 1.4, 0], 7.6, 3.2, -0.7, 0.5, 35),
    world: ({ t }) => (
      <>
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.0, 2.1, 0.16, 48]} />
          <meshStandardMaterial color="#F3F4F7" roughness={0.6} />
        </mesh>
        <WireCube position={[0, 1.45, 0]} size={2.6} progress={easeInOut(prog(t, 0.1, 0.9))} rotation={[0, t * 0.3, 0]} />
        <Octopus t={t} position={[0, 0.16, 0]} scale={0.75 * backOut(prog(t, 1.0, 0.5))} rotation={[0, t * 0.6, 0]} />
      </>
    ),
    tags: [{ text: '3D', color: 'blue', at: [1.6, 3.2, 0], delay: 0.9, size: 64 }],
  },
  /* 9 */ {
    chip: 'SENANG FAHAM', anchor: [4, 6], env: 'studio',
    cam: cam([0, 2.0, 7.4], [0, 1.5, 0], [0.6, 1.9, 6.6], [0, 1.5, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="present" position={[-1.0, 0, 0]} rotation={[0, 0.35, 0]} />
        <CheckMark position={[0.65, 1.9 + dropY(t, 0.15, 0.4, 3), 0.3]} scale={0.75 * pop(t, 0.15, 0.3)} rotation={[0, -0.3, 0]} />
      </>
    ),
    tags: [{ text: 'Senang faham', color: 'green', at: [0.65, 0.6, 0.3], delay: 0.45 }],
  },
  /* 10 */ {
    chip: 'HAIWAN', anchor: [5, 0], env: 'seabed', decor: false,
    cam: cam([0, 2.3, 7.4], [0, 1.0, 0], [0.4, 2.0, 6.8], [0, 1.0, 0], 35, 0.25),
    world: ({ t }) => (
      <>
        <Octopus t={t + 3} scale={0.8} happy arm={(i) => (i === 1 ? { elev: 1.0, curl: Math.sin(t * 9) * 0.8, ground: false } : {})} />
        <Crab t={t} position={[-1.25, 0, 1.2]} rotation={[0, 0.6, 0]} />
        <Shell position={[1.6, 0, 1.2]} />
        <Rock position={[2.6, 0, -1.6]} s={1.2} seed={61} />
        <Seaweed position={[-2.4, 0, -1.8]} t={t} h={8} />
        <Bubble position={[0.8, 2.6 + t, 0.3]} r={0.1} />
      </>
    ),
    tags: [{ text: 'Haiwan', color: 'green', at: [0, 2.5, 0], delay: 0.12 }],
  },
  /* 11 */ {
    chip: 'BADAN MANUSIA', anchor: [5, 1], env: 'studio',
    cam: cam([0.4, 2.2, 6.6], [0, 1.5, 0], [-0.3, 2.0, 5.8], [0, 1.5, 0]),
    world: ({ t }) => (
      <>
        <AbangBlok t={t} pose="idle" position={[-0.9, 0, 0]} rotation={[0, 0.3, 0]} />
        <Heart t={t} bpm={90} size={0.32 * pop(t, 0.1)} position={[-0.95, 1.38, 0.38]} glow={0.6} rotation={[0, 0.3, 0]} />
        <group position={[0.8, 1.6, 0.2]} rotation={[0, 0, Math.PI / 2]} scale={pop(t, 0.05, 0.35)}>
          <BloodTube t={t} len={2.8} n={9} />
        </group>
      </>
    ),
    tags: [{ text: 'Badan manusia', color: 'red', at: [0.7, 3.2, 0.2], delay: 0.25 }],
  },
  /* 12 */ {
    chip: 'ANGKASA', anchor: [5, 3], env: 'night',
    cam: cam([0, 5.5, 9.5], [0, 5.2, 0], [0.6, 5.6, 8.5], [0, 5.3, 0]),
    world: ({ t }) => (
      <>
        <Planet t={t} position={[-0.6, 5.6, -0.5]} scale={0.9 * pop(t, 0, 0.35)} />
        <Moon position={[1.5, 6.6, 0.3]} scale={pop(t, 0.15, 0.3)} />
        <Rocket t={t} position={[1.3, 3.2 + t * 1.8, 0.8]} rotation={[0, 0, -0.35]} scale={0.7} />
        <pointLight position={[2, 7, 4]} intensity={30} color="#FFFFFF" distance={14} />
      </>
    ),
    tags: [{ text: 'Angkasa', color: 'blue', at: [-0.6, 7.0, 0], delay: 0.15 }],
  },
  /* 13 */ {
    chip: 'BENDA DALAM RUMAH', anchor: [5, 4], env: 'studio',
    cam: cam([2.6, 3.4, 8.4], [0, 1.4, -0.5], [1.6, 3.0, 7.6], [0, 1.4, -0.5]),
    world: ({ t }) => (
      <group scale={0.85}>
        <RoomCorner />
        <Sofa position={[-0.6, dropY(t, 0, 0.4, 3), -2.3]} />
        <FloorLamp position={[-3.2, dropY(t, 0.12, 0.4, 3), -2.6]} />
        <TVSet t={t} position={[2.6, dropY(t, 0.24, 0.4, 3), -1.2]} rotation={[0, -0.9, 0]} />
        <Mug position={[0.4, dropY(t, 0.36, 0.4, 3), 0.8]} scale={0.6} color="#FFD23F" />
        <AlarmClock t={t} position={[-1.3, dropY(t, 0.44, 0.4, 3), 0.9]} scale={0.55} />
      </group>
    ),
    tags: [{ text: 'Dalam rumah', color: 'yellow', at: [0.3, 3.1, -1], delay: 0.35 }],
  },
  /* 14 */ {
    chip: 'SEMUA RANDOM', anchor: [6, 0], env: 'studio',
    cam: cam([0, 2.6, 7.8], [0, 1.4, 0], [0.5, 2.3, 7.0], [0, 1.4, 0]),
    world: ({ t }) => {
      const roll = easeOutCubic(prog(t, 0, 0.9));
      return (
        <>
          <Dice position={[lerp(-2.4, 0, roll), 0.5 + Math.abs(Math.sin(roll * Math.PI * 3)) * (1 - roll) * 1.4, 0.4]} rotation={[roll * 7.5, roll * 3.1, roll * 4.7]} scale={1.1} />
          {[0, 1, 2, 3].map((i) => {
            const a = t * 1.6 + (i * Math.PI) / 2;
            const p: V3 = [Math.cos(a) * 1.45, 2.5 + Math.sin(a * 2) * 0.2, Math.sin(a) * 1.0 - 0.4];
            const s = pop(t, 0.2 + i * 0.1, 0.3);
            return (
              <group key={i} position={p} scale={s}>
                {i === 0 && <Heart t={t} size={0.5} />}
                {i === 1 && <Planet t={t} scale={0.28} />}
                {i === 2 && <Mug scale={0.5} position={[0, -0.25, 0]} />}
                {i === 3 && <Octopus t={t} scale={0.25} position={[0, -0.3, 0]} />}
              </group>
            );
          })}
        </>
      );
    },
    tags: [{ text: 'Random!', color: 'yellow', at: [0, 0.9, 0.4], dx: 170, delay: 0.75, size: 52 }],
  },
  /* 15 */ {
    chip: 'FOLLOW SEKARANG', anchor: [7, 0], env: 'studio',
    cam: cam([-0.6, 2.2, 7.4], [0.1, 1.6, 0], [0, 1.9, 6.6], [0.1, 1.6, 0]),
    world: ({ t }) => {
      const press = Math.sin(clamp01((t - 0.75) / 0.25) * Math.PI);
      const s = pop(t, 0.1, 0.4);
      return (
        <>
          <AbangBlok t={t} pose="wave" position={[-1.0, 0, 0]} rotation={[0, 0.3, 0]} scale={0.9} />
          <group position={[0.85, 1.8, 0.4]} rotation={[0, -0.25, 0.05]} scale={[s, s * (1 - press * 0.15), s]}>
            <TextCard text="+ Follow" bg="#FF5A36" fg="#FFFFFF" w={1.55} h={0.62} font={84} depth={0.3} radius={0.14} />
          </group>
          <Confetti t={t} from={0.85} n={30} />
        </>
      );
    },
    tags: [{ text: 'Follow!', color: 'green', at: [0.9, 2.6, 0.4], delay: 0.45 }],
  },
  /* 16 */ {
    chip: 'ESOK: FAKTA PERTAMA', anchor: [8, 0], env: 'studio',
    cam: cam([1.4, 2.3, 7.2], [0, 1.5, 0], [0.4, 2.1, 6.4], [0, 1.5, 0]),
    world: ({ t }) => (
      <>
        <Calendar page={clamp01((t - 0.25) / 0.5)} labels={['HARI INI', 'ESOK']} color="#3DDC84" position={[-0.55, 0.15, 0]} scale={pop(t, 0, 0.35)} rotation={[0, 0.15, 0]} />
        <group position={[1.05, 0.75 + dropY(t, 0.75, 0.45, 3), 0.7]} scale={pop(t, 0.75, 0.3)} rotation={[0, -0.3, 0.06]}>
          <TextCard text="#1" bg="#FFD23F" fg="#16181D" w={0.8} h={0.8} font={130} depth={0.3} radius={0.14} />
        </group>
        <Sparkle position={[1.5, 1.4, 0.7]} s={0.3 * pop(t, 1.0)} rotation={[0, 0, t * 3]} />
      </>
    ),
    tags: [{ text: 'Fakta pertama', color: 'yellow', at: [1.0, 1.6, 0.7], delay: 1.0 }],
  },
  /* 17 */ {
    chip: 'TIGA JANTUNG?', anchor: [8, 3], env: 'deep',
    cam: cam([0, 2.0, 8.4], [0, 1.6, -1], [0, 1.9, 7.0], [0, 1.6, -1], 35, 0),
    world: ({ t }) => (
      <>
        <pointLight position={[0, 2.0, -3.5]} intensity={18} color="#5DA9FF" distance={8} />
        <Octopus t={t} mode="swim" silhouette position={[0, 1.4 + Math.sin(t * 2) * 0.1, -1]} rotation={[0.15, 0.3, 0]} arm={() => ({ spread: 0.95, elev: -1.25, wave: 0.35 })} />
        {[[-0.55, 2.35, 0.1], [0.55, 2.35, 0.1], [0, 2.95, 0.0]].map((p, i) => (
          <Heart key={i} t={t + i * 0.15} bpm={90} size={(i === 2 ? 0.45 : 0.32) * pop(t, 0.6 + i * 0.25, 0.3)} position={p as V3} glow={1} />
        ))}
        {[0, 1, 2].map((i) => (
          <Bubble key={i} position={[(rand(i) - 0.5) * 3, 0.5 + ((t * 0.8 + i) % 3), 0.5]} r={0.06} />
        ))}
      </>
    ),
    tags: [
      { text: 'x3', color: 'red', at: [0.9, 2.9, 0], delay: 1.45, size: 56 },
      { text: 'Esok!', color: 'yellow', at: [-1.0, 0.3, 0], delay: 1.7 },
    ],
  },
];

if (scenes.length !== 17) throw new Error(`Expected 17 scenes, got ${scenes.length}`);

export const V02_SCENES = scenes;
export const V02_Intro: React.FC = () => <VideoEngine scenes={scenes} data={DATA} audio="audio/v02_intro.mp3" />;
