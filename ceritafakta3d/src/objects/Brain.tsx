import React from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { canvasTexture } from '../lib/texture';
import { FONT } from '../lib/theme';

type G = ThreeElements['group'];

const cache: Record<string, THREE.BufferGeometry> = {};

/** Wrinkly hemisphere (gyri faked with a sine displacement). */
const hemiGeo = () => {
  if (cache.hemi) return cache.hemi;
  const g = new THREE.SphereGeometry(1, 64, 48);
  const p = g.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = 1 + 0.045 * Math.sin(v.x * 9 + v.y * 4) * Math.sin(v.y * 11 + v.z * 3) + 0.03 * Math.sin(v.z * 14 + v.x * 5);
    v.multiplyScalar(d);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return (cache.hemi = g);
};

/** Cerebellum: squashed ellipsoid with horizontal folds. */
const cbGeo = () => {
  if (cache.cb) return cache.cb;
  const g = new THREE.SphereGeometry(1, 64, 48);
  const p = g.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = 1 + 0.05 * Math.sin(v.y * 34);
    v.multiplyScalar(d);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return (cache.cb = g);
};

type BrainProps = G & {
  t: number;
  /** cerebellum highlight 0..1 */
  cb?: number;
  cbColor?: string;
  color?: string;
  /** cute face on the front */
  face?: 'none' | 'happy' | 'calm' | 'confused' | 'wow';
  /** pulses travelling from cerebellum (0..1 strength) */
  signals?: number;
  /** opacity of the cerebrum (to show the cerebellum through it) */
  fade?: number;
};

/** Toy-like brain. Front faces +Z, cerebellum at the back-bottom (−Z). About 2.4 units long. */
export const Brain: React.FC<BrainProps> = ({ t, cb = 0, cbColor = '#3DDC84', color = '#F4A7B9', face = 'none', signals = 0, fade = 0, ...g }) => {
  const cbCol = new THREE.Color('#E47A95').lerp(new THREE.Color(cbColor), cb);
  const transparent = fade > 0.001;
  return (
    <group {...g}>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={hemiGeo()} position={[s * 0.5, 0.15, 0]} scale={[0.62, 0.8, 1.15]} castShadow>
          <meshStandardMaterial color={color} roughness={0.55} transparent={transparent} opacity={1 - fade * 0.7} depthWrite={!transparent} />
        </mesh>
      ))}
      {/* cerebellum */}
      <mesh geometry={cbGeo()} position={[0, -0.5, -0.85]} scale={[0.72, 0.38, 0.45]} castShadow>
        <meshStandardMaterial color={cbCol} roughness={0.5} emissive={cbColor} emissiveIntensity={cb * (0.45 + 0.25 * Math.sin(t * 8))} />
      </mesh>
      {/* brain stem */}
      <mesh position={[0, -0.85, -0.45]} rotation={[0.35, 0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.8, 20]} />
        <meshStandardMaterial color="#E58FA5" roughness={0.6} />
      </mesh>
      {signals > 0 &&
        Array.from({ length: 6 }).map((_, i) => {
          const k = ((t * 0.9 + i / 6) % 1 + 1) % 1;
          const a = (i / 6) * Math.PI * 2;
          const r = 0.3 + k * 1.6;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.8, -0.5 + Math.sin(a) * r * 0.5, -0.85 + k * 0.6]} scale={(1 - k) * signals}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshBasicMaterial color={cbColor} />
            </mesh>
          );
        })}
      {face !== 'none' && (
        <group position={[0, 0.15, 1.12]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.34, 0.12, 0]}>
              {face === 'happy' || face === 'calm' ? (
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.1, 0.035, 8, 16, Math.PI]} />
                  <meshStandardMaterial color="#14161A" />
                </mesh>
              ) : (
                <>
                  <mesh scale={[1, face === 'wow' ? 1.3 : 1.1, 0.5]}>
                    <sphereGeometry args={[0.15, 18, 12]} />
                    <meshStandardMaterial color="#FFFFFF" />
                  </mesh>
                  <mesh position={[0, 0, 0.07]} scale={[1, 1.2, 0.5]}>
                    <sphereGeometry args={[0.08, 14, 10]} />
                    <meshStandardMaterial color="#14161A" />
                  </mesh>
                </>
              )}
            </group>
          ))}
          <mesh position={[0, -0.18, 0]} rotation={[0, 0, face === 'confused' ? 0.25 : 0]} scale={face === 'wow' ? [0.6, 1, 1] : [1, 1, 1]}>
            {face === 'wow' ? <sphereGeometry args={[0.1, 14, 10]} /> : <boxGeometry args={[0.26, 0.04, 0.04]} />}
            <meshStandardMaterial color="#6B2A3A" />
          </mesh>
          {face === 'happy' &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.55, -0.05, -0.05]} scale={[1, 0.6, 0.3]}>
                <sphereGeometry args={[0.1, 12, 8]} />
                <meshStandardMaterial color="#FF7E9A" />
              </mesh>
            ))}
        </group>
      )}
    </group>
  );
};

/** Blocky hand (matches Abang Blok). Palm faces +Z, fingers up. `ghost` = transparent prediction copy. */
export const Hand: React.FC<G & { skin?: string; ghost?: boolean; wiggle?: number; t?: number }> = ({ skin = '#E8B48C', ghost = false, wiggle = 0, t = 0, ...g }) => {
  const mat = ghost ? (
    <meshStandardMaterial color="#7FD8FF" emissive="#4CC9F0" emissiveIntensity={0.5} transparent opacity={0.4} depthWrite={false} />
  ) : (
    <meshStandardMaterial color={skin} roughness={0.6} />
  );
  return (
    <group {...g}>
      <RoundedBox args={[0.62, 0.62, 0.22]} radius={0.06} castShadow={!ghost}>
        {mat}
      </RoundedBox>
      {[-0.22, -0.075, 0.075, 0.22].map((x, i) => (
        <group key={i} position={[x, 0.31, 0]} rotation={[Math.sin(t * 18 + i) * wiggle, 0, 0]}>
          <RoundedBox args={[0.13, 0.4, 0.17]} radius={0.05} position={[0, 0.2, 0]} castShadow={!ghost}>
            {mat}
          </RoundedBox>
        </group>
      ))}
      <group position={[-0.31, -0.02, 0]} rotation={[0, 0, 0.7]}>
        <RoundedBox args={[0.14, 0.34, 0.17]} radius={0.05} position={[0, 0.17, 0]} castShadow={!ghost}>
          {mat}
        </RoundedBox>
      </group>
      {/* sleeve */}
      <RoundedBox args={[0.7, 0.4, 0.3]} radius={0.06} position={[0, -0.5, 0]} castShadow={!ghost}>
        {ghost ? mat : <meshStandardMaterial color="#1FA39A" roughness={0.6} />}
      </RoundedBox>
    </group>
  );
};

export const JackInBox: React.FC<G & { t: number; open: number }> = ({ t, open, ...g }) => {
  const spring = Math.max(0, open) * (1 + Math.sin(Math.max(0, open) * 9) * 0.12 * (1 - Math.min(1, open)));
  const helix = React.useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2 * 7;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.22, i / 120, Math.sin(a) * 0.22));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.035, 8, false);
  }, []);
  const bang = canvasTexture('jack-bang', 256, 256, (ctx) => {
    ctx.fillStyle = '#FFD23F';
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 ? 80 : 124;
      ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
    }
    ctx.fill();
    ctx.fillStyle = '#16181D';
    ctx.font = `900 170px ${FONT.sans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 128, 138);
  });
  return (
    <group {...g}>
      <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.1} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#4C6FFF" roughness={0.55} />
      </RoundedBox>
      {[0.71].map((z) => (
        <mesh key={z} position={[0, 0.7, z]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial color="#FFD23F" roughness={0.6} />
        </mesh>
      ))}
      {/* lid hinged at the back */}
      <group position={[0, 1.42, -0.7]} rotation={[-Math.min(1, open * 1.5) * 1.9, 0, 0]}>
        <RoundedBox args={[1.45, 0.1, 1.45]} radius={0.04} position={[0, 0, 0.72]} castShadow>
          <meshStandardMaterial color="#EF4444" roughness={0.55} />
        </RoundedBox>
      </group>
      {open > 0 && (
        <group position={[0, 1.4, 0]}>
          <mesh geometry={helix} scale={[1, 1.4 * spring, 1]}>
            <meshStandardMaterial color="#C9CDD6" metalness={0.6} roughness={0.3} />
          </mesh>
          <group position={[0, 1.4 * spring + 0.45, 0]} rotation={[0, 0, Math.sin(t * 10) * 0.15 * (1 - Math.min(1, open))]}>
            <sprite scale={[1.3 * Math.min(1, open * 1.4), 1.3 * Math.min(1, open * 1.4), 1]}>
              <spriteMaterial map={bang} transparent depthWrite={false} />
            </sprite>
          </group>
        </group>
      )}
    </group>
  );
};

export const Shield: React.FC<G & { color?: string; glow?: number }> = ({ color = '#3DDC84', glow = 0.2, ...g }) => {
  const shape = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1);
    s.bezierCurveTo(0.45, 0.85, 0.75, 0.9, 0.85, 0.85);
    s.bezierCurveTo(0.85, 0.1, 0.6, -0.55, 0, -1);
    s.bezierCurveTo(-0.6, -0.55, -0.85, 0.1, -0.85, 0.85);
    s.bezierCurveTo(-0.75, 0.9, -0.45, 0.85, 0, 1);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 5, curveSegments: 24 });
    geo.center();
    return geo;
  }, []);
  return (
    <group {...g}>
      <mesh geometry={shape} castShadow>
        <meshStandardMaterial color={color} roughness={0.45} emissive={color} emissiveIntensity={glow} />
      </mesh>
      <mesh position={[0, 0.05, 0.2]} scale={[0.55, 0.55, 1]}>
        <ringGeometry args={[0.45, 0.62, 40]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

/** Pulsing target ring (a touch point). Faces +Z. */
export const TouchRing: React.FC<G & { t: number; color?: string }> = ({ t, color = '#EF4444', ...g }) => {
  const k = (t * 1.8) % 1;
  return (
    <group {...g}>
      <mesh>
        <circleGeometry args={[0.09, 20]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh scale={0.4 + k * 1.1}>
        <ringGeometry args={[0.2, 0.26, 32]} />
        <meshBasicMaterial color={color} transparent opacity={1 - k} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** Little motion streaks (friction / wiggle lines). */
export const Streaks: React.FC<G & { t: number; color?: string; n?: number }> = ({ t, color = '#4CC9F0', n = 5, ...g }) => (
  <group {...g}>
    {Array.from({ length: n }).map((_, i) => {
      const k = ((t * 2.5 + i / n) % 1 + 1) % 1;
      return (
        <mesh key={i} position={[(i - (n - 1) / 2) * 0.22, Math.sin(i * 2.1) * 0.25, 0]} rotation={[0, 0, 0.6]} scale={[1, 0.3 + Math.sin(k * Math.PI), 1]}>
          <boxGeometry args={[0.05, 0.4, 0.02]} />
          <meshBasicMaterial color={color} transparent opacity={Math.sin(k * Math.PI)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);
