import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { TaperTube } from './TaperTube';
import { Heart } from './Heart';
import { clamp01, rand } from '../lib/easing';
import { C } from '../lib/theme';

export type ArmMode = 'idle' | 'swim' | 'crawl' | 'curl';
export type ArmParams = { elev: number; bend: number; curl: number; wave: number; len: number; spread: number; ground: boolean; yaw?: number };

export type OctopusProps = ThreeElements['group'] & {
  t: number;
  mode?: ArmMode;
  /** per-arm override (index 0..7). Return partial params merged on top of the mode defaults. */
  arm?: (i: number, t: number) => Partial<ArmParams>;
  color?: string;
  /** 0 normal → 1 see-through body (organs visible) */
  xray?: number;
  /** highlight of the two gill hearts / the systemic heart (0..1) */
  gillHearts?: number;
  bodyHeart?: number;
  /** body heart stopped (0..1 → grey + shrink) */
  bodyHeartDead?: number;
  showHearts?: boolean;
  /** per-arm glow progress base→tip (0..1), and colour */
  armGlow?: number[];
  glowColor?: string;
  /** small glowing cluster inside the head (0..1) */
  brainGlow?: number;
  silhouette?: boolean;
  /** head tilt in radians (z) */
  tilt?: number;
  /** eyes closed happy (^ ^) */
  happy?: boolean;
  /** how many arms (default 8) */
  arms?: number;
  bodyHeartVisible?: boolean;
  bodyHeartSize?: number;
};

export const MODES: Record<ArmMode, ArmParams> = {
  idle: { elev: -0.95, bend: 1.15, curl: 2.4, wave: 0.18, len: 1.9, spread: 1, ground: true },
  crawl: { elev: -0.8, bend: 1.1, curl: 2.0, wave: 0.25, len: 1.95, spread: 1, ground: true },
  swim: { elev: -1.42, bend: -0.05, curl: 0.6, wave: 0.22, len: 2.3, spread: 0.55, ground: false },
  curl: { elev: -0.6, bend: 0.8, curl: 4.2, wave: 0.12, len: 1.6, spread: 1, ground: true },
};

const SEG = 26;

/** Arm centre-line in the octopus' local space (before group transform). Exported so props can follow a tip. */
export const computeArm = (i: number, mode: ArmMode, arm: ((i: number, t: number) => Partial<ArmParams>) | undefined, t: number) => {
  const o = { ...MODES[mode], ...(arm ? arm(i, t) : {}) };
  const yaw = o.yaw ?? (i / 8) * Math.PI * 2 + Math.PI / 8;
  const dx = Math.sin(yaw), dz = Math.cos(yaw);
  let u = 0.42, y = 0.42;
  const step = o.len / SEG;
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < SEG; k++) {
    const s = k / (SEG - 1);
    const ph = t * (mode === 'swim' ? 5 : 2.2) + i * 0.9 - s * 4;
    const ang = o.elev + o.bend * s + o.curl * Math.pow(s, 4) + o.wave * Math.sin(ph) * s;
    if (k > 0) {
      u += Math.cos(ang) * step * o.spread;
      y += Math.sin(ang) * step;
    }
    const r = 0.2 * (1 - s) + 0.035;
    const yy = o.ground ? Math.max(y, r * 0.85) : y;
    pts.push(new THREE.Vector3(dx * u, yy, dz * u));
  }
  return pts;
};

/** Blend two arm parameter sets (e.g. swim → idle while landing). */
export const blendArm = (a: ArmParams, b: ArmParams, k: number): ArmParams => ({
  elev: a.elev + (b.elev - a.elev) * k,
  bend: a.bend + (b.bend - a.bend) * k,
  curl: a.curl + (b.curl - a.curl) * k,
  wave: a.wave + (b.wave - a.wave) * k,
  len: a.len + (b.len - a.len) * k,
  spread: a.spread + (b.spread - a.spread) * k,
  ground: k > 0.5 ? b.ground : a.ground,
});

export const Octopus: React.FC<OctopusProps> = ({
  t, mode = 'idle', arm, color = C.octo, xray = 0, gillHearts = 0, bodyHeart = 0, bodyHeartDead = 0, showHearts,
  armGlow, glowColor = '#FFE04A', brainGlow = 0, silhouette = false, tilt = 0, happy = false, arms = 8,
  bodyHeartVisible = true, bodyHeartSize = 0.5, ...g
}) => {
  const bodyCol = useMemo(() => new THREE.Color(), []);
  bodyCol.set(silhouette ? '#05070C' : color).lerp(new THREE.Color('#BFE3F5'), xray * 0.75);
  const opacity = 1 - xray * 0.72;
  const transparent = xray > 0.001;
  const showOrgans = showHearts ?? xray > 0.05;

  const bodyMat = (
    <meshStandardMaterial color={bodyCol} roughness={silhouette ? 0.9 : 0.62} transparent={transparent} opacity={opacity} depthWrite={!transparent} />
  );

  const armTubes = [];
  for (let i = 0; i < arms; i++) {
    const armPts = computeArm(i, mode, arm, t);
    const glow = armGlow?.[i] ?? 0;
    const gc = new THREE.Color(glowColor);
    armTubes.push(
      <TaperTube
        key={i}
        points={armPts}
        radius={(s) => 0.2 * (1 - s) + 0.035}
        colorAt={(s, out) => {
          out.copy(bodyCol);
          if (glow > 0) {
            const lit = clamp01((glow * 1.15 - s) * 6);
            out.lerp(gc, lit);
          }
        }}
        material={<meshStandardMaterial vertexColors roughness={silhouette ? 0.9 : 0.6} transparent={transparent} opacity={opacity} depthWrite={!transparent} />}
      />,
    );
  }

  const eyeY = 0.86;
  return (
    <group {...g}>
      <group rotation={[0, 0, tilt]} position={[0, 0, 0]}>
        {/* mantle */}
        <mesh position={[0, 1.55, -0.18]} rotation={[-0.28, 0, 0]} scale={[0.95, 1.12, 0.92]} castShadow>
          <sphereGeometry args={[0.82, 40, 32]} />
          {bodyMat}
        </mesh>
        {/* head / face */}
        <mesh position={[0, 0.82, 0.08]} scale={[1, 0.82, 0.95]} castShadow>
          <sphereGeometry args={[0.7, 40, 32]} />
          {bodyMat}
        </mesh>
        {/* spots */}
        {!silhouette && xray < 0.5 &&
          [[0.35, 1.9, 0.42], [-0.42, 1.7, 0.5], [0.12, 2.15, 0.2], [-0.2, 2.05, 0.33], [0.5, 1.45, 0.52]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} scale={[1, 1, 0.35]}>
              <sphereGeometry args={[0.07 + rand(i) * 0.05, 16, 12]} />
              <meshStandardMaterial color={C.octoDark} roughness={0.7} transparent={transparent} opacity={opacity} />
            </mesh>
          ))}
        {/* eyes */}
        {!silhouette &&
          [-1, 1].map((sx) => (
            <group key={sx} position={[sx * 0.27, eyeY, 0.6]}>
              {happy ? (
                <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.02, 0.06]}>
                  <torusGeometry args={[0.1, 0.03, 8, 16, Math.PI]} />
                  <meshStandardMaterial color="#14161A" />
                </mesh>
              ) : (
                <>
                  <mesh scale={[1, 1.15, 0.7]}>
                    <sphereGeometry args={[0.19, 24, 18]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.4} transparent={transparent} opacity={Math.max(opacity, 0.6)} />
                  </mesh>
                  <mesh position={[0, -0.01, 0.1]} scale={[1, 1.2, 0.6]}>
                    <sphereGeometry args={[0.105, 20, 14]} />
                    <meshStandardMaterial color="#14161A" roughness={0.3} />
                  </mesh>
                  <mesh position={[0.04, 0.05, 0.16]}>
                    <sphereGeometry args={[0.03, 10, 8]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                </>
              )}
            </group>
          ))}
        {/* cheeks */}
        {!silhouette && xray < 0.5 &&
          [-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * 0.46, 0.66, 0.5]} scale={[1, 0.6, 0.3]}>
              <sphereGeometry args={[0.09, 14, 10]} />
              <meshStandardMaterial color="#FF9C8A" roughness={0.8} />
            </mesh>
          ))}
        {/* organs (visible in x-ray) */}
        {showOrgans && (
          <group>
            <Heart t={t} bpm={100} size={0.32} position={[-0.5, 1.2, 0.0]} glow={gillHearts} />
            <Heart t={t + 0.2} bpm={100} size={0.32} position={[0.5, 1.2, 0.0]} glow={gillHearts} />
            {bodyHeartVisible && <Heart t={t} bpm={70} size={bodyHeartSize} position={[0, 1.55, -0.15]} glow={bodyHeart} dead={bodyHeartDead} />}
          </group>
        )}
        {brainGlow > 0 && (
          <group position={[0, 0.95, 0.05]}>
            {Array.from({ length: 9 }).map((_, i) => (
              <mesh key={i} position={[(rand(i) - 0.5) * 0.4, (rand(i + 9) - 0.5) * 0.25, (rand(i + 19) - 0.5) * 0.3]}>
                <sphereGeometry args={[0.055, 12, 10]} />
                <meshStandardMaterial color="#4CC9F0" emissive="#4CC9F0" emissiveIntensity={1.5 * brainGlow} />
              </mesh>
            ))}
          </group>
        )}
      </group>
      {armTubes}
    </group>
  );
};
