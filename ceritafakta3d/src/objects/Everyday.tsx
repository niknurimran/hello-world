import React from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { FONT } from '../lib/theme';
import { canvasTexture } from '../lib/texture';
import { rand } from '../lib/easing';

type G = ThreeElements['group'];

const Mat: React.FC<{ c: string; r?: number; e?: number; m?: number }> = ({ c, r = 0.6, e = 0, m = 0 }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={c} emissiveIntensity={e} />
);

/* ---------- household ---------- */
export const Mug: React.FC<G & { color?: string }> = ({ color = '#4CC9F0', ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.45, 0]} castShadow>
      <cylinderGeometry args={[0.42, 0.38, 0.9, 32]} />
      <Mat c={color} />
    </mesh>
    <mesh position={[0, 0.88, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.36, 32]} />
      <Mat c="#6B3F22" r={0.3} />
    </mesh>
    <mesh position={[0.45, 0.48, 0]} castShadow>
      <torusGeometry args={[0.2, 0.06, 12, 24]} />
      <Mat c={color} />
    </mesh>
  </group>
);

export const Bulb: React.FC<G & { on?: number }> = ({ on = 0, ...g }) => (
  <group {...g}>
    <mesh position={[0, 1.05, 0]} castShadow>
      <sphereGeometry args={[0.55, 32, 24]} />
      <meshStandardMaterial color={new THREE.Color('#F4F6FA').lerp(new THREE.Color('#FFE27A'), on)} emissive="#FFD23F" emissiveIntensity={on * 1.2} roughness={0.25} transparent opacity={0.92} />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.24, 0.3, 0.3, 24]} />
      <Mat c="#FFE9A8" e={on * 0.6} r={0.3} />
    </mesh>
    {[0.15, 0.27, 0.39].map((y) => (
      <mesh key={y} position={[0, y, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 24]} />
        <Mat c="#AEB4BF" m={0.5} r={0.35} />
      </mesh>
    ))}
    <mesh position={[0, 0.04, 0]}>
      <cylinderGeometry args={[0.12, 0.16, 0.1, 16]} />
      <Mat c="#3A3F4A" />
    </mesh>
    {on > 0.05 && <pointLight position={[0, 1.05, 0.4]} intensity={8 * on} color="#FFD98A" distance={5} />}
  </group>
);

export const AlarmClock: React.FC<G & { t: number; ring?: number }> = ({ t, ring = 0, ...g }) => {
  const shake = Math.sin(t * 40) * 0.08 * ring;
  return (
    <group {...g} rotation={[0, 0, shake]}>
      <mesh position={[0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.35, 40]} />
        <Mat c="#EF4444" />
      </mesh>
      <mesh position={[0, 0.75, 0.18]}>
        <circleGeometry args={[0.5, 40]} />
        <Mat c="#FFFFFF" r={0.5} />
      </mesh>
      <mesh position={[0, 0.75 + 0.15, 0.19]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.32, 0.01]} />
        <Mat c="#16181D" />
      </mesh>
      <mesh position={[0, 0.75, 0.19]} rotation={[0, 0, -t * 2]}>
        <boxGeometry args={[0.04, 0.42, 0.01]} />
        <meshBasicMaterial color="#16181D" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.38, 1.38, 0]} castShadow>
            <sphereGeometry args={[0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat c="#FFD23F" m={0.3} r={0.35} />
          </mesh>
          <mesh position={[s * 0.38, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.28, 10]} />
            <Mat c="#2B2F38" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const Sofa: React.FC<G & { color?: string }> = ({ color = '#3DA58A', ...g }) => (
  <group {...g}>
    <RoundedBox args={[3, 0.5, 1.2]} radius={0.12} position={[0, 0.45, 0]} castShadow receiveShadow>
      <Mat c={color} />
    </RoundedBox>
    <RoundedBox args={[3, 0.9, 0.35]} radius={0.12} position={[0, 0.95, -0.45]} castShadow>
      <Mat c={color} />
    </RoundedBox>
    {[-1, 1].map((s) => (
      <RoundedBox key={s} args={[0.35, 0.75, 1.2]} radius={0.12} position={[s * 1.5, 0.7, 0]} castShadow>
        <Mat c={color} />
      </RoundedBox>
    ))}
    <RoundedBox args={[0.7, 0.5, 0.18]} radius={0.08} position={[-0.7, 0.95, -0.2]} rotation={[-0.2, 0, 0.1]} castShadow>
      <Mat c="#FFD23F" />
    </RoundedBox>
    {[-1.3, 1.3].map((x) => (
      <mesh key={x} position={[x, 0.1, 0.45]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 10]} />
        <Mat c="#4A3426" />
      </mesh>
    ))}
  </group>
);

export const FloorLamp: React.FC<G & { on?: number }> = ({ on = 1, ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.04, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.4, 0.08, 24]} />
      <Mat c="#2B2F38" />
    </mesh>
    <mesh position={[0, 1.2, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 2.3, 10]} />
      <Mat c="#2B2F38" />
    </mesh>
    <mesh position={[0, 2.45, 0]} castShadow>
      <cylinderGeometry args={[0.32, 0.55, 0.6, 28, 1, true]} />
      <meshStandardMaterial color="#FFF1CC" emissive="#FFD98A" emissiveIntensity={0.5 * on} side={THREE.DoubleSide} roughness={0.7} />
    </mesh>
    <pointLight position={[0, 2.2, 0.3]} intensity={6 * on} color="#FFD98A" distance={5} />
  </group>
);

export const TVSet: React.FC<G & { t: number }> = ({ t, ...g }) => (
  <group {...g}>
    <RoundedBox args={[2.1, 1.3, 0.16]} radius={0.06} position={[0, 1.55, 0]} castShadow>
      <Mat c="#1E222B" />
    </RoundedBox>
    <mesh position={[0, 1.55, 0.085]}>
      <planeGeometry args={[1.9, 1.1]} />
      <meshStandardMaterial color={new THREE.Color().setHSL((t * 0.15) % 1, 0.55, 0.6)} emissive={new THREE.Color().setHSL((t * 0.15) % 1, 0.55, 0.5)} emissiveIntensity={0.6} />
    </mesh>
    <RoundedBox args={[2.6, 0.7, 0.7]} radius={0.08} position={[0, 0.35, 0]} castShadow receiveShadow>
      <Mat c="#C9965F" />
    </RoundedBox>
  </group>
);

export const RoomCorner: React.FC<G & { wall?: string; floor?: string }> = ({ wall = '#F2E3C9', floor = '#C9965F', ...g }) => (
  <group {...g}>
    <RoundedBox args={[9, 0.2, 7]} radius={0.08} position={[0, -0.1, 0]} receiveShadow>
      <Mat c={floor} r={0.8} />
    </RoundedBox>
    <RoundedBox args={[9, 5, 0.25]} radius={0.08} position={[0, 2.5, -3.4]} receiveShadow>
      <Mat c={wall} r={0.9} />
    </RoundedBox>
    <RoundedBox args={[0.25, 5, 7]} radius={0.08} position={[-4.4, 2.5, 0]} receiveShadow>
      <Mat c={wall} r={0.9} />
    </RoundedBox>
    {/* window */}
    <RoundedBox args={[2.2, 1.6, 0.1]} radius={0.05} position={[1.8, 3.0, -3.25]}>
      <meshStandardMaterial color="#9FDBFF" emissive="#BFE9FF" emissiveIntensity={0.4} />
    </RoundedBox>
    <mesh position={[1.8, 3.0, -3.19]}>
      <boxGeometry args={[0.08, 1.6, 0.02]} />
      <Mat c="#FFFFFF" />
    </mesh>
    {/* rug */}
    <mesh position={[0.3, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[2.0, 40]} />
      <Mat c="#EF8A5B" r={1} />
    </mesh>
  </group>
);

/* ---------- concept props ---------- */
/** Desk calendar block; `page` (float) flips pages over. */
export const Calendar: React.FC<G & { page: number; labels: string[]; color?: string }> = ({ page, labels, color = '#EF4444', ...g }) => {
  const idx = Math.min(labels.length - 1, Math.floor(page));
  const frac = page - Math.floor(page);
  const tex = (txt: string) =>
    canvasTexture(`cal-${txt}`, 512, 420, (ctx, w, h) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#16181D';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${txt.length > 3 ? 120 : 220}px ${FONT.sans}`;
      ctx.fillText(txt, w / 2, h / 2 + 10);
    });
  const W = 2.0, H = 1.65;
  return (
    <group {...g}>
      <RoundedBox args={[W + 0.1, 0.5, 0.5]} radius={0.1} position={[0, H + 0.1, 0]} castShadow>
        <Mat c={color} />
      </RoundedBox>
      <RoundedBox args={[W, H, 0.4]} radius={0.06} position={[0, H / 2 - 0.15, -0.05]} castShadow>
        <Mat c="#F4F5F8" />
      </RoundedBox>
      {/* current page */}
      <mesh position={[0, H / 2 - 0.15, 0.16]}>
        <planeGeometry args={[W - 0.12, H - 0.12]} />
        <meshStandardMaterial map={tex(labels[Math.min(labels.length - 1, idx + (frac > 0.5 ? 1 : 0))])} roughness={0.7} />
      </mesh>
      {/* flipping page hinged at the top */}
      {frac > 0.02 && frac < 0.98 && idx < labels.length - 1 && (
        <group position={[0, H - 0.15, 0.2]} rotation={[-frac * Math.PI, 0, 0]}>
          <mesh position={[0, -(H - 0.12) / 2, 0]}>
            <planeGeometry args={[W - 0.12, H - 0.12]} />
            <meshStandardMaterial map={tex(labels[idx])} side={THREE.FrontSide} roughness={0.7} />
          </mesh>
          {/* plain back of the page (avoids mirrored text) */}
          <mesh position={[0, -(H - 0.12) / 2, -0.002]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[W - 0.12, H - 0.12]} />
            <meshStandardMaterial color="#ECEEF2" roughness={0.7} />
          </mesh>
        </group>
      )}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, H + 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.12, 0.04, 8, 16]} />
          <Mat c="#AEB4BF" m={0.5} />
        </mesh>
      ))}
    </group>
  );
};

export const SpeechBubble: React.FC<G & { t: number; dots?: boolean }> = ({ t, dots = true, ...g }) => (
  <group {...g}>
    <RoundedBox args={[2.4, 1.4, 0.4]} radius={0.18} smoothness={4} castShadow>
      <Mat c="#FFFFFF" r={0.5} />
    </RoundedBox>
    <mesh position={[-0.6, -0.85, 0]} rotation={[0, 0, 0.5]} castShadow>
      <coneGeometry args={[0.28, 0.6, 4]} />
      <Mat c="#FFFFFF" r={0.5} />
    </mesh>
    {dots &&
      [-0.55, 0, 0.55].map((x, i) => (
        <mesh key={x} position={[x, 0.05 * Math.max(0, Math.sin(t * 8 - i)), 0.22]}>
          <sphereGeometry args={[0.15, 16, 12]} />
          <Mat c="#B7BAC2" />
        </mesh>
      ))}
  </group>
);

export const CrossX: React.FC<G & { color?: string }> = ({ color = '#EF4444', ...g }) => (
  <group {...g}>
    {[1, -1].map((s) => (
      <RoundedBox key={s} args={[0.38, 2.4, 0.38]} radius={0.15} rotation={[0, 0, s * Math.PI / 4]} castShadow>
        <Mat c={color} r={0.45} />
      </RoundedBox>
    ))}
  </group>
);

export const CheckMark: React.FC<G & { color?: string }> = ({ color = '#3DDC84', ...g }) => (
  <group {...g}>
    <RoundedBox args={[0.38, 0.95, 0.38]} radius={0.15} position={[-0.38, -0.12, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
      <Mat c={color} r={0.45} />
    </RoundedBox>
    <RoundedBox args={[0.38, 1.8, 0.38]} radius={0.15} position={[0.32, 0.22, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
      <Mat c={color} r={0.45} />
    </RoundedBox>
  </group>
);

export const Planet: React.FC<G & { t: number; color?: string; ring?: string }> = ({ t, color = '#F4A259', ring = '#FFE0A3', ...g }) => (
  <group {...g}>
    <mesh rotation={[0, t * 0.6, 0.2]} castShadow>
      <sphereGeometry args={[1.2, 40, 30]} />
      <Mat c={color} />
    </mesh>
    {[0.35, -0.2, 0.7].map((y, i) => (
      <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[Math.sqrt(1.2 * 1.2 - y * y) + 0.005, 0.05, 6, 48]} />
        <Mat c={i === 1 ? '#E07A3F' : '#FFC27A'} />
      </mesh>
    ))}
    <mesh rotation={[1.25, 0, 0.25]}>
      <torusGeometry args={[1.9, 0.16, 4, 64]} />
      <Mat c={ring} r={0.5} />
    </mesh>
  </group>
);

export const Moon: React.FC<G> = (g) => (
  <group {...g}>
    <mesh castShadow>
      <sphereGeometry args={[0.45, 28, 20]} />
      <Mat c="#D5D9E2" r={0.9} />
    </mesh>
    {[[0.2, 0.15, 0.36], [-0.15, -0.1, 0.4], [0.05, -0.25, 0.37]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} scale={[1, 1, 0.4]}>
        <sphereGeometry args={[0.08 + i * 0.02, 12, 8]} />
        <Mat c="#AEB4BF" r={0.9} />
      </mesh>
    ))}
  </group>
);

export const Rocket: React.FC<G & { t: number }> = ({ t, ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.8, 0]} castShadow>
      <capsuleGeometry args={[0.35, 1.0, 8, 20]} />
      <Mat c="#F4F6FA" />
    </mesh>
    <mesh position={[0, 1.65, 0]} castShadow>
      <coneGeometry args={[0.35, 0.55, 24]} />
      <Mat c="#EF4444" />
    </mesh>
    <mesh position={[0, 1.0, 0.32]}>
      <sphereGeometry args={[0.14, 16, 12]} />
      <meshStandardMaterial color="#4CC9F0" roughness={0.1} emissive="#4CC9F0" emissiveIntensity={0.3} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[Math.sin((i / 3) * Math.PI * 2) * 0.35, 0.25, Math.cos((i / 3) * Math.PI * 2) * 0.35]} rotation={[0, (i / 3) * Math.PI * 2, 0]} castShadow>
        <boxGeometry args={[0.06, 0.5, 0.35]} />
        <Mat c="#EF4444" />
      </mesh>
    ))}
    <mesh position={[0, -0.25 - Math.abs(Math.sin(t * 20)) * 0.1, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.25, 0.8 + Math.abs(Math.sin(t * 20)) * 0.2, 16]} />
      <meshBasicMaterial color="#FFB547" transparent opacity={0.9} />
    </mesh>
  </group>
);

/** Rounded dice with pips. */
export const Dice: React.FC<G & { color?: string }> = ({ color = '#FFFFFF', ...g }) => {
  const s = 0.5;
  const faces: { n: [number, number, number]; pips: [number, number][] }[] = [
    { n: [0, 0, 1], pips: [[0, 0]] },
    { n: [0, 0, -1], pips: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] },
    { n: [1, 0, 0], pips: [[-1, -1], [1, 1]] },
    { n: [-1, 0, 0], pips: [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 0]] },
    { n: [0, 1, 0], pips: [[-1, -1], [0, 0], [1, 1]] },
    { n: [0, -1, 0], pips: [[-1, -1], [-1, 1], [1, -1], [1, 1]] },
  ];
  return (
    <group {...g}>
      <RoundedBox args={[1, 1, 1]} radius={0.16} smoothness={4} castShadow>
        <Mat c={color} r={0.4} />
      </RoundedBox>
      {faces.map((f, fi) => {
        const n = new THREE.Vector3(...f.n);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        return (
          <group key={fi} quaternion={q}>
            {f.pips.map(([a, b], i) => (
              <mesh key={i} position={[a * 0.26, b * 0.26, s + 0.001]}>
                <circleGeometry args={[0.09, 20]} />
                <meshStandardMaterial color={fi === 0 ? '#EF4444' : '#16181D'} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/** Floating profile card for the account (generic, no platform branding). */
export const ProfileCard: React.FC<G & { handle: string; name: string }> = ({ handle, name, ...g }) => {
  const tex = canvasTexture(`profile-${handle}`, 1024, 600, (ctx, w, h) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#16181D';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `900 92px ${FONT.sans}`;
    ctx.fillText(name, 330, 250);
    ctx.fillStyle = '#6B7280';
    ctx.font = `700 54px ${FONT.mono}`;
    ctx.fillText(handle, 330, 330);
    // stat pills (no numbers – nothing to claim)
    const pill = (x: number, label: string, c: string) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect(x, 410, 280, 110, 55);
      ctx.fill();
      ctx.fillStyle = '#16181D';
      ctx.font = `800 52px ${FONT.sans}`;
      ctx.textAlign = 'center';
      ctx.fillText(label, x + 140, 485);
      ctx.textAlign = 'left';
    };
    pill(60, 'Haiwan', '#3DDC84');
    pill(370, 'Badan', '#FFD23F');
    pill(680, 'Angkasa', '#4CC9F0');
    // avatar ring
    ctx.fillStyle = '#E8EBF0';
    ctx.beginPath();
    ctx.arc(170, 210, 120, 0, Math.PI * 2);
    ctx.fill();
  });
  return (
    <group {...g}>
      <RoundedBox args={[4.0, 2.4, 0.22]} radius={0.1} smoothness={4} castShadow>
        <Mat c="#FFFFFF" r={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.115]}>
        <planeGeometry args={[3.85, 2.25]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </group>
  );
};

/** Wireframe cube cage (for the "3D" scene). */
export const WireCube: React.FC<G & { size?: number; color?: string; progress?: number }> = ({ size = 3, color = '#4CC9F0', progress = 1, ...g }) => {
  const h = size / 2;
  const corners = [-h, h];
  const edges: [THREE.Vector3, THREE.Vector3][] = [];
  for (const a of corners)
    for (const b of corners) {
      edges.push([new THREE.Vector3(-h, a, b), new THREE.Vector3(h, a, b)]);
      edges.push([new THREE.Vector3(a, -h, b), new THREE.Vector3(a, h, b)]);
      edges.push([new THREE.Vector3(a, b, -h), new THREE.Vector3(a, b, h)]);
    }
  return (
    <group {...g}>
      {edges.map(([p, q], i) => {
        const k = Math.max(0, Math.min(1, progress * 1.6 - (i / edges.length) * 0.6));
        if (k <= 0) return null;
        const end = p.clone().lerp(q, k);
        const mid = p.clone().add(end).multiplyScalar(0.5);
        const len = p.distanceTo(end);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.035, 0.035, len, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
        );
      })}
      {progress > 0.6 &&
        [-h, h].flatMap((x) => [-h, h].flatMap((y) => [-h, h].map((z) => [x, y, z] as [number, number, number]))).map((p, i) => (
          <mesh key={`c${i}`} position={p} scale={Math.min(1, (progress - 0.6) * 4)}>
            <sphereGeometry args={[0.1, 12, 8]} />
            <meshStandardMaterial color="#FFFFFF" emissive={color} emissiveIntensity={0.5} />
          </mesh>
        ))}
    </group>
  );
};

export const randSpin = (i: number, t: number): [number, number, number] => [t * (0.6 + rand(i)), t * (0.8 + rand(i + 1)), 0];
