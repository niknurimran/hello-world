import React from 'react';
import { RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { C } from '../lib/theme';

export type Pose = 'idle' | 'point' | 'shocked' | 'scratch' | 'laugh' | 'wave' | 'oneFinger' | 'present' | 'tickleSelf' | 'relax' | 'bored';

export type Outfit = { shirt?: string; pants?: string; hair?: string; skin?: string };
/** Second character for stories that need "someone else". */
export const KAWAN: Outfit = { shirt: '#FF7A45', pants: '#3B3B45', hair: '#5A3A1E', skin: '#C98E64' };

type Props = ThreeElements['group'] & {
  t: number;
  pose?: Pose;
  /** diving mask + snorkel */
  mask?: boolean;
  /** pointing arm side: 1 = viewer's right (+x), -1 = viewer's left */
  side?: 1 | -1;
  outfit?: Outfit;
  /** explorer hat */
  hat?: boolean;
};

const Box: React.FC<{ args: [number, number, number]; color: string; position?: [number, number, number]; r?: number }> = ({ args, color, position, r = 0.05 }) => (
  <RoundedBox args={args} radius={r} smoothness={3} position={position} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={0.62} />
  </RoundedBox>
);

/** Blocky narrator mascot. Faces +Z. Height ≈ 2.35 units, feet at y=0. */
export const AbangBlok: React.FC<Props> = ({ t, pose = 'idle', mask = false, side = 1, outfit = {}, hat = false, ...g }) => {
  const shirt = outfit.shirt ?? C.shirt, pants = outfit.pants ?? C.pants, hair = outfit.hair ?? C.hair, skin = outfit.skin ?? C.skin;
  // limb angles: [x, z] for arms (+x arm = A, -x arm = B), legs x only
  let aX = 0, aZ = 0.08, bX = 0, bZ = -0.08, headZ = 0, headX = 0, bob = Math.sin(t * 3) * 0.015, bodyZ = 0, jump = 0;
  let mouth: 'smile' | 'o' | 'laugh' | 'flat' = 'smile';
  let squint = false;
  let finger = false;

  switch (pose) {
    case 'point':
      aX = -1.35; aZ = 0.35 + Math.sin(t * 6) * 0.04;
      headZ = -0.08;
      break;
    case 'shocked':
      aZ = 2.55 + Math.sin(t * 18) * 0.05; bZ = -2.55 - Math.sin(t * 18) * 0.05;
      mouth = 'o';
      jump = Math.abs(Math.sin(Math.min(t, 0.6) * Math.PI / 0.6)) * 0.15;
      break;
    case 'scratch':
      aX = -0.6; aZ = 2.55 + Math.sin(t * 14) * 0.12;
      headZ = 0.14; mouth = 'o';
      break;
    case 'laugh':
      aX = -0.5; aZ = 0.5; bX = -0.5; bZ = -0.5;
      bodyZ = Math.sin(t * 22) * 0.06; bob = Math.abs(Math.sin(t * 11)) * 0.06;
      mouth = 'laugh'; squint = true; headX = -0.12;
      break;
    case 'wave':
      aZ = 2.6 + Math.sin(t * 9) * 0.35;
      mouth = 'laugh';
      break;
    case 'oneFinger':
      aX = -0.2; aZ = 2.95; finger = true; mouth = 'o';
      break;
    case 'tickleSelf':
      aX = -0.35; aZ = -0.55 + Math.sin(t * 26) * 0.1; bX = -0.35; bZ = 0.55 - Math.sin(t * 26 + 1) * 0.1;
      mouth = 'flat';
      break;
    case 'bored':
      mouth = 'flat'; headZ = Math.sin(t * 1.5) * 0.06;
      break;
    case 'relax':
      aX = 0.35; aZ = 2.45; bX = 0.35; bZ = -2.45; squint = true; mouth = 'smile'; headZ = 0.08;
      break;
    case 'present':
      aX = -0.9; aZ = 0.9; mouth = 'smile';
      break;
  }
  if (side === -1 && (pose === 'point' || pose === 'wave' || pose === 'oneFinger' || pose === 'scratch' || pose === 'present')) {
    [aX, bX] = [bX, aX];
    [aZ, bZ] = [-bZ, -aZ];
  }

  return (
    <group {...g}>
      <group position={[0, bob + jump, 0]} rotation={[0, 0, bodyZ]}>
        {/* legs */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.16, 0.86, 0]}>
            <Box args={[0.28, 0.86, 0.3]} color={pants} position={[0, -0.43, 0]} />
            <Box args={[0.3, 0.12, 0.36]} color="#2B2B33" position={[0, -0.8, 0.03]} r={0.04} />
          </group>
        ))}
        {/* body */}
        <Box args={[0.66, 0.78, 0.38]} color={shirt} position={[0, 1.25, 0]} />
        {/* arms */}
        {[1, -1].map((sx) => {
          const x = sx === 1 ? aX : bX;
          const z = sx === 1 ? aZ : bZ;
          return (
            <group key={sx} position={[sx * 0.45, 1.58, 0]} rotation={[x, 0, z]}>
              <Box args={[0.22, 0.4, 0.24]} color={shirt} position={[0, -0.16, 0]} />
              <Box args={[0.2, 0.36, 0.22]} color={skin} position={[0, -0.5, 0]} />
              {finger && sx === (side === 1 ? 1 : -1) && <Box args={[0.07, 0.2, 0.07]} color={skin} position={[0, -0.75, 0.03]} r={0.03} />}
            </group>
          );
        })}
        {/* head */}
        <group position={[0, 1.66, 0]} rotation={[headX, 0, headZ]}>
          <group position={[0, 0.34, 0]}>
            <Box args={[0.62, 0.62, 0.62]} color={skin} r={0.06} />
            {/* hair */}
            <Box args={[0.66, 0.16, 0.66]} color={hair} position={[0, 0.28, -0.01]} r={0.05} />
            <Box args={[0.66, 0.42, 0.14]} color={hair} position={[0, 0.1, -0.27]} r={0.04} />
            {/* eyes */}
            {[-1, 1].map((sx) =>
              squint ? (
                <mesh key={sx} position={[sx * 0.14, 0.06, 0.315]}>
                  <boxGeometry args={[0.12, 0.035, 0.01]} />
                  <meshStandardMaterial color="#14161A" />
                </mesh>
              ) : (
                <mesh key={sx} position={[sx * 0.14, 0.06, 0.315]}>
                  <boxGeometry args={[0.075, mouth === 'o' ? 0.14 : 0.11, 0.01]} />
                  <meshStandardMaterial color="#14161A" />
                </mesh>
              ),
            )}
            {/* mouth */}
            <mesh position={[0, -0.12, 0.315]}>
              <boxGeometry args={mouth === 'o' ? [0.12, 0.12, 0.01] : mouth === 'laugh' ? [0.24, 0.1, 0.01] : mouth === 'flat' ? [0.16, 0.03, 0.01] : [0.2, 0.035, 0.01]} />
              <meshStandardMaterial color={mouth === 'smile' || mouth === 'flat' ? '#6B3A2A' : '#3A1414'} />
            </mesh>
            {hat && (
              <group position={[0, 0.4, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.62, 0.62, 0.05, 32]} />
                  <meshStandardMaterial color="#C9A36B" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.16, 0]} castShadow>
                  <cylinderGeometry args={[0.3, 0.36, 0.3, 28]} />
                  <meshStandardMaterial color="#C9A36B" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.365, 0.365, 0.08, 28]} />
                  <meshStandardMaterial color="#5A3A1E" roughness={0.8} />
                </mesh>
              </group>
            )}
            {mask && (
              <group position={[0, 0.06, 0.33]}>
                <RoundedBox args={[0.56, 0.24, 0.08]} radius={0.04} smoothness={3}>
                  <meshStandardMaterial color="#2F8CFF" roughness={0.5} />
                </RoundedBox>
                <mesh position={[0, 0, 0.045]}>
                  <boxGeometry args={[0.46, 0.16, 0.01]} />
                  <meshStandardMaterial color="#BFEFFF" transparent opacity={0.55} roughness={0.1} />
                </mesh>
                <Box args={[0.66, 0.06, 0.6]} color="#1B1F2A" position={[0, 0, -0.33]} r={0.02} />
                <group position={[0.36, 0.1, -0.1]}>
                  <Box args={[0.07, 0.5, 0.07]} color="#FFD23F" position={[0, 0.1, 0]} r={0.03} />
                </group>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
