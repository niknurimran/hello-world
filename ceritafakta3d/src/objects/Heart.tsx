import React, { useMemo } from 'react';
import * as THREE from 'three';
import { beat } from '../lib/easing';
import type { ThreeElements } from '@react-three/fiber';

let heartGeo: THREE.ExtrudeGeometry | null = null;
const getHeartGeo = () => {
  if (heartGeo) return heartGeo;
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-0.15, -0.72, -1.0, -0.2, -1.0, 0.28);
  s.bezierCurveTo(-1.0, 0.78, -0.55, 0.98, -0.3, 0.98);
  s.bezierCurveTo(-0.1, 0.98, 0, 0.8, 0, 0.66);
  s.bezierCurveTo(0, 0.8, 0.1, 0.98, 0.3, 0.98);
  s.bezierCurveTo(0.55, 0.98, 1.0, 0.78, 1.0, 0.28);
  s.bezierCurveTo(1.0, -0.2, 0.15, -0.72, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.24, bevelSize: 0.2, bevelSegments: 8, curveSegments: 28 });
  g.center();
  g.computeVertexNormals();
  heartGeo = g;
  return g;
};

type Props = ThreeElements['group'] & {
  t: number;
  size?: number;
  bpm?: number;
  /** 0 = healthy red, 1 = grey & shrunk & still */
  dead?: number;
  color?: string;
  glow?: number;
  opacity?: number;
};

export const Heart: React.FC<Props> = ({ t, size = 1, bpm = 80, dead = 0, color = '#E23B4A', glow = 0, opacity = 1, ...g }) => {
  const geo = getHeartGeo();
  const pulse = beat(t, bpm) * (1 - dead);
  const s = size * (1 + 0.12 * pulse) * (1 - 0.35 * dead);
  const col = useMemo(() => new THREE.Color(), []);
  col.set(color).lerp(new THREE.Color('#8A8D94'), dead);
  return (
    <group {...g}>
      <mesh geometry={geo} scale={s * 0.5} castShadow>
        <meshStandardMaterial
          color={col}
          roughness={0.35}
          metalness={0.05}
          emissive={color}
          emissiveIntensity={(0.15 + glow * 0.6) * (1 - dead) * (0.6 + pulse * 0.4)}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};
