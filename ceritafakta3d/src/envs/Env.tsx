import React from 'react';
import * as THREE from 'three';
import { ContactShadows } from '@react-three/drei';
import { rand } from '../lib/easing';
import { C } from '../lib/theme';

export type EnvName = 'studio' | 'seabed' | 'deep' | 'lab' | 'darklab' | 'water' | 'night' | 'neon' | 'macro' | 'split' | 'tomb' | 'space' | 'desert';

/** CSS background drawn behind the (transparent) WebGL canvas. */
export const ENV_BG: Record<EnvName, string> = {
  studio: 'linear-gradient(180deg, #C9CCD3 0%, #C3C7CF 38%, #A9AEB8 56%, #C6C9D0 70%, #D2D5DB 100%)',
  lab: 'linear-gradient(180deg, #D3DAE4 0%, #C4CCD8 45%, #A9B3C2 58%, #CBD1DA 100%)',
  seabed: 'linear-gradient(180deg, #7FD6F0 0%, #3FA3D2 35%, #2879B0 60%, #2B6E9C 100%)',
  water: 'linear-gradient(180deg, #A6ECFF 0%, #5CC6F2 35%, #2F93D6 70%, #1F6FB5 100%)',
  deep: 'radial-gradient(ellipse at 50% 40%, #12264A 0%, #0A1631 45%, #040915 100%)',
  darklab: 'radial-gradient(ellipse at 50% 38%, #3A4252 0%, #232833 45%, #12151B 100%)',
  night: 'linear-gradient(180deg, #070B22 0%, #111A44 45%, #22306A 75%, #2E3D7A 100%)',
  neon: 'radial-gradient(ellipse at 50% 42%, #10182E 0%, #070A14 60%, #020306 100%)',
  macro: 'radial-gradient(ellipse at 50% 42%, #7A2A44 0%, #4A1328 50%, #22070F 100%)',
  tomb: 'radial-gradient(ellipse at 50% 40%, #6A4426 0%, #3A2414 50%, #1A0F08 100%)',
  space: 'radial-gradient(ellipse at 50% 40%, #1A1440 0%, #0A0820 55%, #020208 100%)',
  desert: 'linear-gradient(180deg, #FFC98A 0%, #FFB27A 35%, #F2A06A 55%, #EBC48C 70%, #E8C48E 100%)',
  split: 'linear-gradient(90deg, #4FB8E8 0%, #3A9FD8 49.6%, #FFFFFF 49.6%, #FFFFFF 50.4%, #E6D3A3 50.4%, #D9C18A 100%)',
};

export const DARK_ENVS: EnvName[] = ['deep', 'darklab', 'night', 'neon', 'macro', 'tomb', 'space'];

const FOG: Record<EnvName, [string, number, number] | null> = {
  studio: ['#B8BCC5', 14, 42],
  lab: ['#B9C1CD', 14, 40],
  seabed: ['#2E83B5', 9, 30],
  water: ['#3BA2DD', 8, 32],
  deep: ['#071027', 4, 16],
  darklab: ['#1A1E27', 8, 26],
  night: ['#1A2556', 14, 50],
  neon: ['#05070D', 6, 22],
  macro: ['#3A0F1F', 9, 24],
  split: null,
  tomb: ['#2A190D', 7, 22],
  space: null,
  desert: ['#F0B985', 18, 55],
};

export const Lights: React.FC<{ env: EnvName; key2?: number }> = ({ env }) => {
  const dark = DARK_ENVS.includes(env);
  const under = env === 'seabed' || env === 'water';
  return (
    <>
      <hemisphereLight args={[under ? '#DFF6FF' : '#FFFFFF', under ? '#7A6A45' : '#9EA3AD', dark ? 0.55 : 1.55]} />
      <ambientLight intensity={dark ? 0.25 : 0.35} />
      <directionalLight
        position={[4, 9, 6]}
        intensity={dark ? 0.9 : 2.1}
        color={under ? '#FFF7DD' : '#FFFFFF'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
      <directionalLight position={[-5, 4, -3]} intensity={dark ? 0.35 : 0.6} color={under ? '#9FDFFF' : '#E8EEFF'} />
    </>
  );
};

const Floor: React.FC<{ color: string; y?: number }> = ({ color, y = 0 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <circleGeometry args={[80, 64]} />
    <meshStandardMaterial color={color} roughness={0.95} />
  </mesh>
);

/** Gently rolling sand. */
let sandGeo: THREE.PlaneGeometry | null = null;
const getSand = () => {
  if (sandGeo) return sandGeo;
  const g = new THREE.PlaneGeometry(90, 90, 90, 90);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const d = Math.sqrt(x * x + y * y);
    const h = (Math.sin(x * 0.45) * Math.cos(y * 0.38) * 0.18 + Math.sin(x * 0.13 + y * 0.21) * 0.35) * Math.min(1, d / 6);
    p.setZ(i, h);
  }
  g.computeVertexNormals();
  sandGeo = g;
  return g;
};

export const Rock: React.FC<{ position: [number, number, number]; s?: number; seed?: number; color?: string }> = ({ position, s = 1, seed = 1, color = C.rock }) => (
  <mesh position={position} scale={[s * (1 + rand(seed) * 0.4), s * (0.6 + rand(seed + 1) * 0.3), s * (1 + rand(seed + 2) * 0.3)]} rotation={[0, rand(seed + 3) * 6, 0]} castShadow receiveShadow>
    <dodecahedronGeometry args={[0.6, 1]} />
    <meshStandardMaterial color={color} roughness={0.85} flatShading />
  </mesh>
);

export const Seaweed: React.FC<{ position: [number, number, number]; t: number; h?: number; seed?: number; color?: string }> = ({ position, t, h = 6, seed = 0, color = C.weed }) => (
  <group position={position}>
    {Array.from({ length: h }).map((_, i) => {
      const sway = Math.sin(t * 1.6 + seed + i * 0.5) * 0.06 * i;
      return (
        <mesh key={i} position={[sway, 0.25 + i * 0.36, 0]} rotation={[0, 0, sway * 0.6]} castShadow>
          <capsuleGeometry args={[0.1 * (1 - i / (h + 2)), 0.26, 4, 10]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
    })}
  </group>
);

/** Floating specks (deterministic). */
export const Particles: React.FC<{ t: number; n?: number; color?: string; area?: [number, number, number]; size?: number; center?: [number, number, number]; speed?: number }> = ({
  t, n = 60, color = '#FFFFFF', area = [12, 10, 10], size = 0.04, center = [0, 3, -2], speed = 0.15,
}) => (
  <group position={center}>
    {Array.from({ length: n }).map((_, i) => {
      const x = (rand(i) - 0.5) * area[0];
      const y = ((((rand(i + 50) * area[1] + t * speed * (0.5 + rand(i + 9))) % area[1]) + area[1]) % area[1]) - area[1] / 2;
      const z = (rand(i + 100) - 0.5) * area[2];
      return (
        <mesh key={i} position={[x + Math.sin(t + i) * 0.1, y, z]}>
          <sphereGeometry args={[size * (0.6 + rand(i + 7)), 6, 5]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
      );
    })}
  </group>
);

export const LightRays: React.FC<{ t: number; color?: string; opacity?: number }> = ({ t, color = '#FFFFFF', opacity = 0.09 }) => (
  <group position={[0, 9, -3]}>
    {[-3.5, -1.2, 1.4, 3.6, 5.5].map((x, i) => (
      <mesh key={i} position={[x, -4, -i * 0.8]} rotation={[0, 0, 0.18 + Math.sin(t * 0.5 + i) * 0.03]}>
        <cylinderGeometry args={[0.15, 0.9 + i * 0.1, 12, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * (0.7 + 0.3 * Math.sin(t * 1.3 + i * 2))} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    ))}
  </group>
);

export const Stars: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {Array.from({ length: 140 }).map((_, i) => {
      const a = rand(i) * Math.PI * 2;
      const e = 0.12 + rand(i + 300) * 1.1;
      const r = 40;
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
      return (
        <mesh key={i} position={[Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.abs(Math.cos(a)) * Math.cos(e) * r - 5]}>
          <sphereGeometry args={[0.07 + rand(i + 1) * 0.12, 6, 5]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5 + 0.5 * tw} />
        </mesh>
      );
    })}
  </group>
);

/** Environment shell: fog, lights, floor & decor. Children are the scene's props. */
export const Env: React.FC<{ env: EnvName; t: number; shadowScale?: number; decor?: boolean; children?: React.ReactNode }> = ({
  env, t, children, shadowScale = 14, decor = true,
}) => {
  const fog = FOG[env];
  return (
    <>
      {fog && <fog attach="fog" args={fog} />}
      <Lights env={env} />
      {env === 'studio' && <Floor color="#D9DBE0" />}
      {env === 'lab' && <Floor color="#D5DAE2" />}
      {env === 'darklab' && (
        <>
          <Floor color="#2A2F3A" />
          <spotLight position={[0, 9, 2]} angle={0.38} penumbra={0.6} intensity={120} color="#FFF4E0" castShadow />
        </>
      )}
      {env === 'tomb' && (
        <>
          <Floor color="#B58A55" />
          <Particles t={t} n={40} color="#FFD9A0" size={0.025} area={[10, 8, 8]} speed={0.05} />
        </>
      )}
      {env === 'desert' && <Floor color="#E6C188" />}
      {env === 'space' && <Stars t={t} />}
      {env === 'night' && (
        <>
          <Stars t={t} />
          <mesh position={[9, 14, -30]}>
            <sphereGeometry args={[2.2, 32, 24]} />
            <meshBasicMaterial color="#FFF6D6" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[60, 48]} />
            <meshStandardMaterial color="#26405A" roughness={1} />
          </mesh>
        </>
      )}
      {(env === 'seabed') && (
        <>
          <mesh geometry={getSand()} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial color={C.sand} roughness={1} />
          </mesh>
          {decor && (
            <>
              <Rock position={[-3.2, 0.1, -2.5]} s={1.6} seed={3} />
              <Rock position={[3.6, 0.1, -3.5]} s={2.0} seed={7} />
              <Rock position={[-5.5, 0.1, -7]} s={2.4} seed={11} />
              <Seaweed position={[-2.4, 0, -3.6]} t={t} h={8} seed={1} />
              <Seaweed position={[-2.0, 0, -4.2]} t={t} h={6} seed={2} color="#2E9A5C" />
              <Seaweed position={[4.4, 0, -2.4]} t={t} h={7} seed={3} />
              <Seaweed position={[2.6, 0, -6.5]} t={t} h={9} seed={4} color="#5BC27F" />
              <Seaweed position={[-6, 0, -4]} t={t} h={9} seed={5} />
            </>
          )}
          <LightRays t={t} />
          <Particles t={t} n={45} color="#E8FBFF" size={0.035} />
        </>
      )}
      {env === 'water' && (
        <>
          <LightRays t={t} opacity={0.12} />
          <Particles t={t} n={50} color="#FFFFFF" size={0.04} center={[0, 5, -2]} area={[14, 16, 10]} />
        </>
      )}
      {env === 'deep' && <Particles t={t} n={80} color="#9CC8FF" size={0.03} area={[14, 12, 12]} speed={0.08} />}
      {env === 'macro' && <Particles t={t} n={40} color="#FFB3C8" size={0.03} area={[8, 8, 6]} center={[0, 2, 0]} />}
      {(env === 'studio' || env === 'lab' || env === 'split' || env === 'seabed' || env === 'tomb' || env === 'desert') && (
        <ContactShadows position={[0, 0.01, 0]} scale={shadowScale} blur={2.6} opacity={env === 'seabed' ? 0.35 : 0.45} far={4} resolution={512} color="#1A1D24" />
      )}
      {children}
    </>
  );
};
