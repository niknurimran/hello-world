import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { rand } from '../lib/easing';

type G = ThreeElements['group'];
export const HONEY = '#F5A623';

/* ---------- jars ---------- */
let potGeo: THREE.LatheGeometry | null = null;
const getPot = () => {
  if (potGeo) return potGeo;
  const pts: THREE.Vector2[] = [];
  const prof = [[0.0, 0], [0.45, 0], [0.62, 0.2], [0.78, 0.55], [0.8, 0.9], [0.7, 1.25], [0.45, 1.45], [0.36, 1.55], [0.42, 1.68], [0.42, 1.74], [0.3, 1.74]];
  prof.forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
  const curve = new THREE.SplineCurve(pts);
  potGeo = new THREE.LatheGeometry(curve.getPoints(60), 48);
  potGeo.computeVertexNormals();
  return potGeo;
};

/** Ancient clay honey pot. `open` 0..1 lifts the stopper; `glow` lights the honey inside. */
export const ClayPot: React.FC<G & { open?: number; glow?: number; dusty?: boolean }> = ({ open = 0, glow = 0, dusty = false, ...g }) => (
  <group {...g}>
    <mesh geometry={getPot()} castShadow receiveShadow>
      <meshStandardMaterial color={dusty ? '#A9774E' : '#B9683C'} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
    {/* painted bands */}
    {[0.55, 0.95].map((y) => (
      <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.795, 0.03, 8, 48]} />
        <meshStandardMaterial color="#3A2A20" roughness={0.8} />
      </mesh>
    ))}
    {/* honey surface */}
    <mesh position={[0, 1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.36, 32]} />
      <meshStandardMaterial color={HONEY} emissive={HONEY} emissiveIntensity={0.3 + glow} roughness={0.2} />
    </mesh>
    {/* stopper */}
    <mesh position={[open * 0.5, 1.82 + open * 0.8, 0]} rotation={[0, 0, open * 0.8]} castShadow>
      <cylinderGeometry args={[0.36, 0.3, 0.22, 24]} />
      <meshStandardMaterial color="#8A6A45" roughness={0.9} />
    </mesh>
    {glow > 0 && <pointLight position={[0, 2.2, 0.3]} intensity={10 * glow} color="#FFB547" distance={4} />}
  </group>
);

/** Modern glass honey jar. level 0..1, colour/cloudiness, crystals, lid on/off. */
export const HoneyJar: React.FC<G & { level?: number; color?: string; lid?: number; crystals?: number; murky?: number; t?: number }> = ({
  level = 0.75, color = HONEY, lid = 1, crystals = 0, murky = 0, t = 0, ...g
}) => {
  const h = 1.5, r = 0.6;
  const col = new THREE.Color(color).lerp(new THREE.Color('#7A5A3A'), murky);
  return (
    <group {...g}>
      <mesh position={[0, (h * level) / 2 + 0.04, 0]}>
        <cylinderGeometry args={[r - 0.04, r - 0.04, h * level, 40]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.25 * (1 - murky)} roughness={0.25} transparent opacity={0.93} />
      </mesh>
      {crystals > 0 &&
        Array.from({ length: 22 }).map((_, i) => {
          const a = rand(i) * Math.PI * 2;
          const rr = 0.15 + rand(i + 3) * 0.38;
          return (
            <mesh key={i} position={[Math.cos(a) * rr, 0.15 + rand(i + 7) * h * level * 0.85, Math.sin(a) * rr]} rotation={[rand(i) * 3, rand(i + 1) * 3, 0]} scale={crystals * (0.08 + rand(i + 9) * 0.08)}>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#FFF2C8" roughness={0.3} flatShading />
            </mesh>
          );
        })}
      {murky > 0 &&
        Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`b${i}`} position={[(rand(i) - 0.5) * 0.7, h * level - 0.05 + Math.sin(t * 3 + i) * 0.03, (rand(i + 4) - 0.5) * 0.7]} scale={murky * (0.05 + rand(i + 2) * 0.05)}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#E9DCC0" roughness={0.6} />
          </mesh>
        ))}
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r, h, 48, 1, true]} />
        <meshStandardMaterial color="#EAF7FF" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[r, r, 0.04, 40]} />
        <meshStandardMaterial color="#EAF7FF" transparent opacity={0.4} />
      </mesh>
      {/* lid: lid=1 screwed on, 0 floating off to the side */}
      <group position={[(1 - lid) * 1.2, 0.1 + (h - 0.01) * lid + Math.sin((1 - lid) * Math.PI) * 0.7, (1 - lid) * 0.45]} rotation={[0, (1 - lid) * 6, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[r + 0.04, r + 0.04, 0.2, 40]} />
          <meshStandardMaterial color="#F2C14E" roughness={0.45} metalness={0.3} />
        </mesh>
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 24) * Math.PI * 2) * (r + 0.045), 0, Math.sin((i / 24) * Math.PI * 2) * (r + 0.045)]}>
            <boxGeometry args={[0.03, 0.18, 0.03]} />
            <meshStandardMaterial color="#D9A53A" />
          </mesh>
        ))}
      </group>
      {/* label */}
      <mesh position={[0, h * 0.45, r + 0.005]}>
        <planeGeometry args={[0.7, 0.45]} />
        <meshStandardMaterial color="#FFF6E0" roughness={0.8} />
      </mesh>
      <mesh position={[0, h * 0.45, r + 0.01]}>
        <circleGeometry args={[0.12, 6]} />
        <meshStandardMaterial color={HONEY} />
      </mesh>
    </group>
  );
};

export const Dipper: React.FC<G> = (g) => (
  <group {...g}>
    <mesh position={[0, 0.9, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 1.6, 12]} />
      <meshStandardMaterial color="#C99A5B" roughness={0.7} />
    </mesh>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[0, i * 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.2 - Math.abs(i - 1.5) * 0.04, 0.2 - Math.abs(i - 1.5) * 0.04, 0.08, 20]} />
        <meshStandardMaterial color="#C99A5B" roughness={0.7} />
      </mesh>
    ))}
    <mesh position={[0, 0.15, 0]} scale={[1, 1.4, 1]}>
      <sphereGeometry args={[0.22, 20, 14]} />
      <meshStandardMaterial color={HONEY} emissive={HONEY} emissiveIntensity={0.25} roughness={0.2} transparent opacity={0.9} />
    </mesh>
  </group>
);

/* ---------- time ---------- */
export const Hourglass: React.FC<G & { t: number; flow?: number }> = ({ t, flow = 1, ...g }) => {
  const k = (t * 0.4 * flow) % 1;
  return (
    <group {...g}>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[1.4, 0.18, 1.4]} radius={0.06} position={[0, s * 1.05 + 1.15, 0]} castShadow>
          <meshStandardMaterial color="#8A5A34" roughness={0.6} />
        </RoundedBox>
      ))}
      {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.15, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.0, 10]} />
          <meshStandardMaterial color="#8A5A34" roughness={0.6} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 1.15 + s * 0.48, 0]} rotation={[s > 0 ? Math.PI : 0, 0, 0]}>
          <coneGeometry args={[0.5, 0.95, 32, 1, true]} />
          <meshStandardMaterial color="#E8F6FF" transparent opacity={0.3} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      {/* sand top (shrinking) and bottom (growing) */}
      <mesh position={[0, 1.15 + 0.2 + (1 - k) * 0.12, 0]} rotation={[Math.PI, 0, 0]} scale={0.35 + (1 - k) * 0.55}>
        <coneGeometry args={[0.45, 0.6, 24]} />
        <meshStandardMaterial color="#F2C14E" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3 + k * 0.2, 0]} scale={0.4 + k * 0.6}>
        <coneGeometry args={[0.45, 0.45, 24]} />
        <meshStandardMaterial color="#F2C14E" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
        <meshStandardMaterial color="#F2C14E" />
      </mesh>
    </group>
  );
};

/* ---------- critters ---------- */
export type Mood = 'happy' | 'sour' | 'dead' | 'scared';
/** Cartoon bacterium (capsule with eyes & little flagella). */
export const Bacterium: React.FC<G & { t: number; mood?: Mood; color?: string; dry?: number }> = ({ t, mood = 'happy', color = '#7BD66B', dry = 0, ...g }) => {
  const col = new THREE.Color(color).lerp(new THREE.Color('#9A9A88'), Math.max(dry, mood === 'dead' ? 1 : 0));
  const wob = mood === 'dead' ? 0 : Math.sin(t * 8) * 0.06;
  const sx = 1 - dry * 0.35;
  return (
    <group {...g}>
      <mesh rotation={[0, 0, Math.PI / 2 + wob]} scale={[sx, 1, sx]} castShadow>
        <capsuleGeometry args={[0.32, 0.55, 8, 20]} />
        <meshStandardMaterial color={col} roughness={0.55} flatShading={dry > 0.3} />
      </mesh>
      {/* flagella */}
      {mood !== 'dead' &&
        [-0.25, 0, 0.25].map((y, i) => (
          <mesh key={i} position={[-0.75, y * 0.6, 0]} rotation={[0, 0, Math.sin(t * 14 + i) * 0.5 + 0.2 * (i - 1)]}>
            <capsuleGeometry args={[0.025, 0.35, 4, 6]} />
            <meshStandardMaterial color={col} />
          </mesh>
        ))}
      {/* face on +Z */}
      <group position={[0.25, 0.05, 0.28 * sx]}>
        {[-1, 1].map((s) =>
          mood === 'dead' ? (
            <group key={s} position={[s * 0.11, 0.05, 0.02]}>
              {[1, -1].map((d) => (
                <mesh key={d} rotation={[0, 0, (d * Math.PI) / 4]}>
                  <boxGeometry args={[0.12, 0.025, 0.01]} />
                  <meshStandardMaterial color="#14161A" />
                </mesh>
              ))}
            </group>
          ) : mood === 'sour' ? (
            <mesh key={s} position={[s * 0.11, 0.05, 0.02]} rotation={[0, 0, s * 0.3]}>
              <boxGeometry args={[0.11, 0.025, 0.01]} />
              <meshStandardMaterial color="#14161A" />
            </mesh>
          ) : (
            <group key={s} position={[s * 0.11, 0.05, 0]}>
              <mesh scale={[1, mood === 'scared' ? 1.4 : 1.15, 0.5]}>
                <sphereGeometry args={[0.08, 12, 10]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0, 0, 0.035]} scale={[1, 1.2, 0.5]}>
                <sphereGeometry args={[0.045, 10, 8]} />
                <meshStandardMaterial color="#14161A" />
              </mesh>
            </group>
          ),
        )}
        <mesh position={[0, -0.1, 0.02]} rotation={[0, 0, mood === 'sour' ? 0.3 : 0]}>
          {mood === 'scared' ? <sphereGeometry args={[0.04, 10, 8]} /> : <boxGeometry args={[mood === 'happy' ? 0.12 : 0.09, 0.025, 0.01]} />}
          <meshStandardMaterial color="#3A1414" />
        </mesh>
      </group>
    </group>
  );
};

/** Cute bee, faces +X when flying. */
export const Bee: React.FC<G & { t: number }> = ({ t, ...g }) => (
  <group {...g}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <capsuleGeometry args={[0.3, 0.45, 8, 20]} />
      <meshStandardMaterial color="#FFC83D" roughness={0.55} />
    </mesh>
    {[-0.12, 0.12].map((x) => (
      <mesh key={x} position={[x - 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.1, 24]} />
        <meshStandardMaterial color="#1E1E24" roughness={0.6} />
      </mesh>
    ))}
    <mesh position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <coneGeometry args={[0.07, 0.18, 10]} />
      <meshStandardMaterial color="#1E1E24" />
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh position={[0.32, 0.1, s * 0.12]} scale={[1, 1.15, 0.5]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color="#14161A" />
        </mesh>
        <mesh position={[-0.05, 0.38, s * 0.15]} rotation={[s * (0.4 + Math.sin(t * 60) * 0.5), 0, 0.3]} scale={[0.32, 0.03, 0.2]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color="#E8F8FF" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.4, 0.32, s * 0.08]} rotation={[s * 0.3, 0, -0.4]}>
          <cylinderGeometry args={[0.012, 0.012, 0.25, 6]} />
          <meshStandardMaterial color="#1E1E24" />
        </mesh>
      </group>
    ))}
  </group>
);

/** Honeycomb slab (hex cells). `fill` 0..1 how many cells hold honey. */
export const Honeycomb: React.FC<G & { fill?: number; glow?: number; rows?: number; cols?: number }> = ({ fill = 0.7, glow = 0, rows = 4, cols = 5, ...g }) => {
  const cells = useMemo(() => {
    const arr: { x: number; y: number; on: boolean }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) arr.push({ x: (c - (cols - 1) / 2) * 0.52 + (r % 2) * 0.26, y: (r - (rows - 1) / 2) * 0.45, on: rand(r * 10 + c) < fill });
    return arr;
  }, [rows, cols, fill]);
  return (
    <group {...g}>
      {cells.map((c, i) => (
        <group key={i} position={[c.x, c.y, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.35, 6, 1, true]} />
            <meshStandardMaterial color="#F7D27A" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, c.on ? 0.05 : -0.12]} rotation={[0, 0, Math.PI / 6]}>
            <circleGeometry args={[0.27, 6]} />
            <meshStandardMaterial color={c.on ? HONEY : '#E8B85A'} emissive={c.on ? HONEY : '#000'} emissiveIntensity={c.on ? 0.25 + glow : 0} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Enzyme blob (pac-man shape) — schematic. */
export const Enzyme: React.FC<G & { t: number; color?: string }> = ({ t, color = '#3DDC84', ...g }) => {
  const open = 0.5 + Math.sin(t * 8) * 0.25;
  return (
    <group {...g}>
      <mesh rotation={[0, Math.PI / 2 - 0.5 - open / 2, 0]} castShadow>
        <sphereGeometry args={[0.45, 32, 24, 0, Math.PI * 2 - open, 0, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.05, 0.22, 0.38]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshStandardMaterial color="#14161A" />
      </mesh>
    </group>
  );
};

export const Lemon: React.FC<G> = (g) => (
  <group {...g}>
    <mesh scale={[1.25, 1, 1]} castShadow>
      <sphereGeometry args={[0.5, 32, 24]} />
      <meshStandardMaterial color="#FFE14D" roughness={0.6} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.62, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
        <coneGeometry args={[0.1, 0.16, 12]} />
        <meshStandardMaterial color="#F5D020" roughness={0.6} />
      </mesh>
    ))}
  </group>
);

export const LemonSlice: React.FC<G> = (g) => (
  <group {...g}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 0.12, 32]} />
      <meshStandardMaterial color="#FFE14D" roughness={0.5} />
    </mesh>
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[0, 0, 0.065]} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
        <circleGeometry args={[0.4, 8, 0.05, Math.PI / 4 - 0.1]} />
        <meshStandardMaterial color="#FFF3A6" roughness={0.4} />
      </mesh>
    ))}
  </group>
);

export const WarningSign: React.FC<G> = (g) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1);
    s.lineTo(0.95, -0.65);
    s.lineTo(-0.95, -0.65);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.06, bevelSegments: 4 });
    geo.center();
    return geo;
  }, []);
  return (
    <group {...g}>
      <mesh geometry={shape} castShadow>
        <meshStandardMaterial color="#FFD23F" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.12, 0.13]}>
        <boxGeometry args={[0.16, 0.6, 0.02]} />
        <meshStandardMaterial color="#16181D" />
      </mesh>
      <mesh position={[0, -0.36, 0.13]}>
        <boxGeometry args={[0.16, 0.16, 0.02]} />
        <meshStandardMaterial color="#16181D" />
      </mesh>
    </group>
  );
};

export const Bowl: React.FC<G & { t: number; steam?: number }> = ({ t, steam = 1, ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[1.45, 1.1, 0.9, 48, 1, true]} />
      <meshStandardMaterial color="#F3F4F7" roughness={0.5} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.02, 0]}>
      <cylinderGeometry args={[1.1, 1.1, 0.04, 48]} />
      <meshStandardMaterial color="#F3F4F7" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.36, 48]} />
      <meshStandardMaterial color="#8FD8FF" transparent opacity={0.65} roughness={0.1} emissive="#8FD8FF" emissiveIntensity={0.15} />
    </mesh>
    {steam > 0 &&
      Array.from({ length: 6 }).map((_, i) => {
        const k = ((t * 0.6 + i / 6) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.9 + Math.sin(t * 2 + i) * 0.1, 0.8 + k * 1.6, Math.sin(i * 2.1) * 0.6]} scale={(0.12 + k * 0.25) * steam}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.45 * (1 - k)} depthWrite={false} />
          </mesh>
        );
      })}
  </group>
);

export const Pyramid: React.FC<G & { color?: string }> = ({ color = '#E2B86B', ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
      <coneGeometry args={[1.4, 1.4, 4]} />
      <meshStandardMaterial color={color} roughness={0.85} flatShading />
    </mesh>
  </group>
);

export const Sun: React.FC<G & { t: number }> = ({ t, ...g }) => (
  <group {...g}>
    <mesh>
      <sphereGeometry args={[1.3, 48, 32]} />
      <meshStandardMaterial color="#FFB21E" emissive="#FF9A1E" emissiveIntensity={1.1} roughness={0.6} />
    </mesh>
    <mesh scale={1.25 + Math.sin(t * 3) * 0.03}>
      <sphereGeometry args={[1.3, 32, 24]} />
      <meshBasicMaterial color="#FFD27A" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    {Array.from({ length: 12 }).map((_, i) => (
      <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2 + t * 0.3]}>
        <group position={[0, 1.95 + Math.sin(t * 4 + i) * 0.08, 0]}>
          <mesh>
            <boxGeometry args={[0.14, 0.5, 0.06]} />
            <meshBasicMaterial color="#FFD23F" />
          </mesh>
        </group>
      </mesh>
    ))}
  </group>
);

/** Little flying photon/light dot path from a to b. */
export const LightBeam: React.FC<{ from: [number, number, number]; to: [number, number, number]; t: number; n?: number }> = ({ from, to, t, n = 10 }) => (
  <group>
    {Array.from({ length: n }).map((_, i) => {
      const k = ((t * 0.5 + i / n) % 1 + 1) % 1;
      return (
        <mesh key={i} position={[from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshBasicMaterial color="#FFE9A0" />
        </mesh>
      );
    })}
  </group>
);

/** Sandstone block (tomb walls). */
export const Stone: React.FC<G & { size?: [number, number, number]; color?: string }> = ({ size = [1, 1, 1], color = '#C99A5B', ...g }) => (
  <RoundedBox args={size} radius={0.06} smoothness={2} castShadow receiveShadow {...(g as object)}>
    <meshStandardMaterial color={color} roughness={0.9} />
  </RoundedBox>
);
