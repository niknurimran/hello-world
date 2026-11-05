import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { clamp01, rand } from '../lib/easing';
import { C, FONT } from '../lib/theme';
import { canvasTexture, roundRect } from '../lib/texture';
import { TaperTube } from './TaperTube';

type G = ThreeElements['group'];

/* ---------- lab ---------- */
export const Bench: React.FC<G> = (g) => (
  <group {...g}>
    <RoundedBox args={[7, 0.3, 3]} radius={0.08} position={[0, 1.6, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#F3F4F7" roughness={0.55} />
    </RoundedBox>
    <RoundedBox args={[6.6, 1.45, 2.6]} radius={0.08} position={[0, 0.74, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#5D7BA6" roughness={0.65} />
    </RoundedBox>
    {[-1.65, 1.65].map((x) => (
      <mesh key={x} position={[x, 0.9, 1.31]}>
        <boxGeometry args={[3.1, 1.1, 0.02]} />
        <meshStandardMaterial color="#6E8BB4" roughness={0.6} />
      </mesh>
    ))}
  </group>
);

/** Glass beaker. fill 0..1, liquid colour, glow 0..1, swirl time */
export const Beaker: React.FC<G & { fill?: number; liquid?: string; glow?: number; t?: number; swirl?: number }> = ({ fill = 0.55, liquid = '#9AA3B5', glow = 0, t = 0, swirl = 0, ...g }) => {
  const h = 1.6, r = 0.62;
  const lh = h * fill;
  return (
    <group {...g}>
      <mesh position={[0, lh / 2 + 0.05, 0]}>
        <cylinderGeometry args={[r - 0.05, r - 0.05, lh, 40]} />
        <meshStandardMaterial color={liquid} roughness={0.25} emissive={liquid} emissiveIntensity={glow * 0.9} transparent opacity={0.92} />
      </mesh>
      {/* liquid surface swirl */}
      {swirl > 0 && (
        <group position={[0, lh + 0.06, 0]} rotation={[0, -t * 5, 0]}>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const rr = 0.18 + (i % 3) * 0.12;
            return (
              <mesh key={i} position={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} rotation={[-Math.PI / 2, 0, a]}>
                <torusGeometry args={[0.14, 0.025, 6, 16, Math.PI * 0.8]} />
                <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5 * swirl} emissive="#FFFFFF" emissiveIntensity={0.3} />
              </mesh>
            );
          })}
        </group>
      )}
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r, h, 48, 1, true]} />
        <meshStandardMaterial color="#E9F6FF" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.035, 10, 48]} />
        <meshStandardMaterial color="#F5FBFF" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[r, r, 0.04, 48]} />
        <meshStandardMaterial color="#E9F6FF" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      {/* measure marks */}
      {[0.4, 0.75, 1.1].map((y) => (
        <mesh key={y} position={[0, y, r + 0.005]}>
          <boxGeometry args={[0.22, 0.03, 0.005]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

let dropGeo: THREE.LatheGeometry | null = null;
const getDropGeo = () => {
  if (dropGeo) return dropGeo;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI; // 0 bottom → π top
    const y = -Math.cos(a);
    const r = Math.sin(a) * (y < 0 ? 1 : Math.pow(1 - y, 0.9) * 1);
    pts.push(new THREE.Vector2(Math.max(0.0001, r * (y < 0 ? 1 : 1 - y * 0.15)), y < 0 ? y : y * 1.55));
  }
  dropGeo = new THREE.LatheGeometry(pts, 40);
  dropGeo.computeVertexNormals();
  return dropGeo;
};

export const Drop: React.FC<G & { color?: string; glow?: number }> = ({ color = '#3D7BFF', glow = 0, ...g }) => (
  <group {...g}>
    <mesh geometry={getDropGeo()} castShadow>
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.05} emissive={color} emissiveIntensity={0.15 + glow} />
    </mesh>
    <mesh position={[-0.3, 0.35, 0.72]} scale={[0.6, 1, 0.4]}>
      <sphereGeometry args={[0.13, 12, 10]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
  </group>
);

/* ---------- chemistry ---------- */
export const Atom: React.FC<{ position: [number, number, number]; r: number; color: string; glow?: number; glowColor?: string }> = ({ position, r, color, glow = 0, glowColor }) => (
  <mesh position={position} castShadow>
    <sphereGeometry args={[r, 28, 20]} />
    <meshStandardMaterial color={color} roughness={0.35} emissive={glowColor ?? color} emissiveIntensity={glow} />
  </mesh>
);

export const Bond: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r?: number; color?: string }> = ({ a, b, r = 0.06, color = '#DADDE3' }) => {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 10]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
};

/** Stylised hemocyanin-like cluster: 2 copper atoms in a cage of grey/blue atoms (schematic, not to scale). */
export const Molecule: React.FC<G & { copperGlow?: number; blue?: number; o2?: number }> = ({ copperGlow = 0, blue = 0, o2 = 0, ...g }) => {
  const nodes = useMemo(() => {
    const arr: { p: THREE.Vector3; type: 'cu' | 'c' | 'n' }[] = [
      { p: new THREE.Vector3(-0.55, 0, 0), type: 'cu' },
      { p: new THREE.Vector3(0.55, 0, 0), type: 'cu' },
    ];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const y = (i % 2 ? 0.55 : -0.55) + (rand(i) - 0.5) * 0.3;
      arr.push({ p: new THREE.Vector3(Math.cos(a) * 1.5, y, Math.sin(a) * 1.1), type: i % 3 === 0 ? 'n' : 'c' });
    }
    return arr;
  }, []);
  const blueCol = new THREE.Color('#2F7BFF');
  const cu = new THREE.Color(C.copper).lerp(blueCol, blue);
  return (
    <group {...g}>
      {nodes.slice(2).map((n, i) => (
        <React.Fragment key={i}>
          <Bond a={n.p} b={nodes[n.p.x < 0 ? 0 : 1].p} />
          <Bond a={n.p} b={nodes[2 + ((i + 1) % 12)].p} r={0.045} />
        </React.Fragment>
      ))}
      {nodes.map((n, i) => (
        <Atom
          key={i}
          position={n.p.toArray() as [number, number, number]}
          r={n.type === 'cu' ? 0.36 : n.type === 'n' ? 0.22 : 0.2}
          color={n.type === 'cu' ? `#${cu.getHexString()}` : n.type === 'n' ? new THREE.Color('#5C7CFA').lerp(blueCol, blue).getStyle() : new THREE.Color('#9AA1AE').lerp(new THREE.Color('#7FB2FF'), blue).getStyle()}
          glow={n.type === 'cu' ? copperGlow * 0.9 + blue * 0.8 : blue * 0.35}
        />
      ))}
      {o2 > 0 && (
        <group>
          <Atom position={[-0.18, 0.05 + (1 - o2) * 2.5, (1 - o2) * 1.5]} r={0.24} color="#4CC9F0" glow={0.3} />
          <Atom position={[0.18, 0.05 + (1 - o2) * 2.5, (1 - o2) * 1.5]} r={0.24} color="#4CC9F0" glow={0.3} />
        </group>
      )}
    </group>
  );
};

export const O2: React.FC<G & { glow?: number }> = ({ glow = 0.2, ...g }) => (
  <group {...g}>
    <Atom position={[-0.2, 0, 0]} r={0.26} color="#4CC9F0" glow={glow} />
    <Atom position={[0.2, 0, 0]} r={0.26} color="#4CC9F0" glow={glow} />
  </group>
);

/** Periodic table tile with symbol + atomic number (canvas texture on the front face). */
export const PeriodicTile: React.FC<G & { symbol: string; num: number; name: string; color: string; metal?: boolean }> = ({ symbol, num, name, color, metal, ...g }) => {
  const tex = canvasTexture(`tile-${symbol}`, 512, 512, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 64px ${FONT.sans}`;
    ctx.textAlign = 'left';
    ctx.fillText(String(num), 44, 100);
    ctx.textAlign = 'center';
    ctx.font = `900 230px ${FONT.sans}`;
    ctx.fillText(symbol, w / 2, 340);
    ctx.font = `700 50px ${FONT.sans}`;
    ctx.fillText(name, w / 2, 450);
  });
  return (
    <group {...g}>
      <RoundedBox args={[2, 2, 0.32]} radius={0.12} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={metal ? 0.35 : 0.6} metalness={metal ? 0.45 : 0} />
      </RoundedBox>
      <mesh position={[0, 0, 0.165]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial map={tex} roughness={0.6} metalness={metal ? 0.3 : 0} />
      </mesh>
    </group>
  );
};

export const Coin: React.FC<G> = (g) => (
  <group {...g}>
    <mesh castShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.1, 36]} />
      <meshStandardMaterial color="#D07F45" roughness={0.3} metalness={0.6} />
    </mesh>
    <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.28, 0.33, 32]} />
      <meshStandardMaterial color="#F0A56E" roughness={0.3} metalness={0.6} />
    </mesh>
  </group>
);

/* ---------- blood ---------- */
let rbcGeo: THREE.LatheGeometry | null = null;
const getRbc = () => {
  if (rbcGeo) return rbcGeo;
  const pts: THREE.Vector2[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    const x = Math.sin(a);
    const y = Math.cos(a) * (0.18 + 0.32 * x * x);
    pts.push(new THREE.Vector2(Math.max(0.0001, x * 0.5), y * 0.5));
  }
  rbcGeo = new THREE.LatheGeometry(pts, 36);
  rbcGeo.computeVertexNormals();
  return rbcGeo;
};
export const BloodCell: React.FC<G & { color?: string }> = ({ color = '#D7263D', ...g }) => (
  <mesh geometry={getRbc()} castShadow {...(g as object)}>
    <meshStandardMaterial color={color} roughness={0.45} emissive={color} emissiveIntensity={0.12} />
  </mesh>
);

/** Transparent tube with cells flowing (axis along +X). */
export const BloodTube: React.FC<G & { t: number; len?: number; cell?: string; n?: number }> = ({ t, len = 5, cell = '#D7263D', n = 12, ...g }) => (
  <group {...g}>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.55, 0.55, len, 40, 1, true]} />
      <meshStandardMaterial color="#F4E8EA" transparent opacity={0.28} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    {Array.from({ length: n }).map((_, i) => {
      const x = ((((i / n) * len + t * 1.1) % len) + len) % len - len / 2;
      return (
        <BloodCell
          key={i}
          color={cell}
          position={[x, (rand(i) - 0.5) * 0.45, (rand(i + 3) - 0.5) * 0.45]}
          rotation={[rand(i + 5) * 3 + t, rand(i + 6) * 3, rand(i + 7) * 3]}
          scale={0.6}
        />
      );
    })}
  </group>
);

/* ---------- gills ---------- */
export const Gill: React.FC<G & { t: number; color?: string }> = ({ t, color = '#FF8FB1', ...g }) => (
  <group {...g}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <capsuleGeometry args={[0.12, 3.2, 6, 12]} />
      <meshStandardMaterial color="#E86A92" roughness={0.6} />
    </mesh>
    {Array.from({ length: 14 }).map((_, i) => {
      const x = -1.6 + (i / 13) * 3.2;
      const sway = Math.sin(t * 2.5 + i * 0.7) * 0.12;
      const len = 1.2 - Math.abs(x) * 0.25;
      return [-1, 1].map((sy) => (
        <mesh key={`${i}${sy}`} position={[x, sy * (len / 2 + 0.05), sway * sy]} rotation={[sway, 0, sy * 0.15]} scale={[0.12, len / 2, 0.06]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ));
    })}
  </group>
);

/** Particles streaming along a polyline path; colour can change from c0→c1 over path. */
export const Stream: React.FC<{ path: THREE.Vector3[]; t: number; n?: number; c0?: string; c1?: string; switchAt?: number; size?: number; speed?: number; tube?: boolean }> = ({
  path, t, n = 18, c0 = '#8F96A3', c1 = '#3D7BFF', switchAt = 2, size = 0.14, speed = 0.25, tube = true,
}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path), [path]);
  const tubePts = useMemo(() => curve.getPoints(40), [curve]);
  const a = new THREE.Color(c0), b = new THREE.Color(c1), c = new THREE.Color();
  return (
    <group>
      {tube && (
        <TaperTube
          points={tubePts}
          radius={() => size * 1.6}
          radial={14}
          castShadow={false}
          material={<meshStandardMaterial color="#FFE3EA" transparent opacity={0.3} depthWrite={false} roughness={0.15} />}
        />
      )}
      {Array.from({ length: n }).map((_, i) => {
        const u = (((i / n + t * speed) % 1) + 1) % 1;
        const p = curve.getPointAt(u);
        c.copy(a).lerp(b, clamp01((u - switchAt) * 8));
        return (
          <mesh key={i} position={p}>
            <sphereGeometry args={[size, 12, 10]} />
            <meshStandardMaterial color={c.clone()} roughness={0.4} emissive={c.clone()} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Bubble: React.FC<{ position: [number, number, number]; r?: number }> = ({ position, r = 0.15 }) => (
  <mesh position={position}>
    <sphereGeometry args={[r, 16, 12]} />
    <meshStandardMaterial color="#E6FAFF" transparent opacity={0.55} roughness={0.05} emissive="#BFEFFF" emissiveIntensity={0.25} />
  </mesh>
);

/* ---------- neurons ---------- */
export const NeuronNet: React.FC<G & { t: number; n?: number; color?: string; radius?: number }> = ({ t, n = 46, color = '#4CC9F0', radius = 4, ...g }) => {
  const nodes = useMemo(
    () => Array.from({ length: n }).map((_, i) => new THREE.Vector3((rand(i) - 0.5) * radius * 2, (rand(i + 77) - 0.5) * radius * 2.2, (rand(i + 155) - 0.5) * radius)),
    [n, radius],
  );
  const edges = useMemo(() => {
    const e: [number, number][] = [];
    nodes.forEach((a, i) => {
      const d = nodes.map((b, j) => ({ j, d: a.distanceTo(b) })).filter((x) => x.j !== i).sort((x, y) => x.d - y.d).slice(0, 2);
      d.forEach(({ j }) => i < j && e.push([i, j]));
    });
    return e;
  }, [nodes]);
  return (
    <group {...g}>
      {edges.map(([i, j], k) => {
        const pulse = (((t * 0.9 + rand(k) * 3) % 1) + 1) % 1;
        const p = nodes[i].clone().lerp(nodes[j], pulse);
        return (
          <group key={k}>
            <Bond a={nodes[i]} b={nodes[j]} r={0.025} color="#2B6C8F" />
            <mesh position={p}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
        );
      })}
      {nodes.map((p, i) => {
        const glow = 0.6 + 0.6 * Math.max(0, Math.sin(t * 4 + i * 1.7));
        return (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.13 + rand(i + 9) * 0.08, 14, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- pie chart (thirds) ---------- */
export const PieSlice: React.FC<G & { start: number; len: number; color: string; r?: number; h?: number }> = ({ start, len, color, r = 1.6, h = 0.45, ...g }) => (
  <group {...g}>
    <mesh castShadow position={[0, h / 2, 0]}>
      <cylinderGeometry args={[r, r, h, 48, 1, false, start, len]} />
      <meshStandardMaterial color={color} roughness={0.55} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

/* ---------- seabed critters ---------- */
export const Crab: React.FC<G & { t: number }> = ({ t, ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.32, 0]} scale={[1, 0.55, 0.75]} castShadow>
      <sphereGeometry args={[0.42, 24, 16]} />
      <meshStandardMaterial color="#F0533A" roughness={0.6} />
    </mesh>
    {[-1, 1].map((sx) => (
      <group key={sx}>
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[sx * 0.42, 0.18, -0.15 + k * 0.17]} rotation={[0, 0, sx * (0.9 + Math.sin(t * 14 + k * 2) * 0.25)]} castShadow>
            <capsuleGeometry args={[0.035, 0.28, 4, 6]} />
            <meshStandardMaterial color="#D9432D" />
          </mesh>
        ))}
        <mesh position={[sx * 0.38, 0.4, 0.38]} castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshStandardMaterial color="#F0533A" roughness={0.6} />
        </mesh>
        <mesh position={[sx * 0.13, 0.62, 0.22]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#14161A" />
        </mesh>
      </group>
    ))}
  </group>
);

export const Shell: React.FC<G & { color?: string }> = ({ color = '#FFD9C7', ...g }) => (
  <group {...g}>
    {Array.from({ length: 7 }).map((_, i) => (
      <mesh key={i} position={[0, 0.06, 0]} rotation={[0, (i - 3) * 0.24, 0]} scale={[0.09, 0.08, 0.38]} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    ))}
  </group>
);

export const Jar: React.FC<G & { lid?: number }> = ({ lid = 0, ...g }) => (
  <group {...g}>
    <mesh position={[0, 0.45, 0]}>
      <cylinderGeometry args={[0.35, 0.35, 0.9, 32]} />
      <meshStandardMaterial color="#DDF4FF" transparent opacity={0.4} roughness={0.05} />
    </mesh>
    <mesh position={[0, 0.3, 0]}>
      <sphereGeometry args={[0.2, 16, 12]} />
      <meshStandardMaterial color="#FFB547" roughness={0.6} />
    </mesh>
    <mesh position={[lid * 0.3, 0.95 + lid * 0.55, 0]} rotation={[0, lid * 4, lid * 0.6]} castShadow>
      <cylinderGeometry args={[0.38, 0.38, 0.14, 32]} />
      <meshStandardMaterial color="#EF4444" roughness={0.5} />
    </mesh>
  </group>
);

/* ---------- misc ---------- */
export const UFO: React.FC<G & { t: number; beam?: number }> = ({ t, beam = 0, ...g }) => (
  <group {...g}>
    <group rotation={[0, t * 1.2, 0]}>
      <mesh scale={[1, 0.28, 1]} castShadow>
        <sphereGeometry args={[1.6, 40, 24]} />
        <meshStandardMaterial color="#B8C2D6" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.72, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7FF3C5" transparent opacity={0.75} roughness={0.1} emissive="#3DDC84" emissiveIntensity={0.3} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const on = Math.sin(t * 8 + i) > 0;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.35, -0.06, Math.sin(a) * 1.35]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshBasicMaterial color={on ? '#FFD23F' : '#FF5A36'} />
          </mesh>
        );
      })}
    </group>
    {beam > 0 && (
      <mesh position={[0, -3.1, 0]}>
        <cylinderGeometry args={[0.7, 2.0, 6, 40, 1, true]} />
        <meshBasicMaterial color="#9DFFCF" transparent opacity={0.3 * beam} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    )}
  </group>
);

/** Flat text card in 3D (e.g. "?", "+ Follow"). */
export const TextCard: React.FC<G & { text: string; bg: string; fg: string; w?: number; h?: number; font?: number; radius?: number; depth?: number }> = ({
  text, bg, fg, w = 2, h = 0.8, font = 120, radius = 0.15, depth = 0.18, ...g
}) => {
  const tex = canvasTexture(`card-${text}-${bg}-${fg}-${w}-${h}`, Math.round(w * 256), Math.round(h * 256), (ctx, cw, ch) => {
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, cw, ch, 0);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = `900 ${font}px ${FONT.sans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2, ch / 2 + font * 0.05);
  });
  return (
    <group {...g}>
      <RoundedBox args={[w, h, depth]} radius={Math.min(radius, depth / 2 - 0.001)} smoothness={4} castShadow>
        <meshStandardMaterial color={bg} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, depth / 2 + 0.003]}>
        <planeGeometry args={[w - radius * 1.2, h - radius * 1.2]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </group>
  );
};

export const QMark: React.FC<G & { color?: string }> = ({ color = '#FFD23F', ...g }) => {
  const tex = canvasTexture(`q-${color}`, 256, 256, (ctx) => {
    ctx.font = `900 230px ${FONT.sans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#16181D';
    ctx.strokeText('?', 128, 138);
    ctx.fillStyle = color;
    ctx.fillText('?', 128, 138);
  });
  return (
    <group {...g}>
      <sprite scale={[1, 1, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
};

export const Sparkle: React.FC<G & { s?: number; color?: string }> = ({ s = 1, color = '#FFD23F', ...g }) => (
  <group {...g} scale={s}>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
        <boxGeometry args={[i % 2 ? 0.08 : 0.1, i % 2 ? 0.55 : 0.85, 0.04]} />
        <meshBasicMaterial color={color} />
      </mesh>
    ))}
  </group>
);

export const Feather: React.FC<G> = (g) => (
  <group {...g}>
    <mesh rotation={[0, 0, 0]} castShadow>
      <cylinderGeometry args={[0.025, 0.035, 2.0, 8]} />
      <meshStandardMaterial color="#F4F0E6" roughness={0.6} />
    </mesh>
    {Array.from({ length: 16 }).map((_, i) => {
      const y = -0.5 + (i / 15) * 1.4;
      const len = 0.42 * Math.sin(((i + 1) / 17) * Math.PI);
      return [-1, 1].map((sx) => (
        <mesh key={`${i}${sx}`} position={[sx * len * 0.5, y, 0]} rotation={[0, 0, sx * -0.9]} scale={[0.03, len * 0.6, 0.012]} castShadow>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={i % 4 === 0 ? '#FF7EB6' : '#FFE5F0'} roughness={0.8} />
        </mesh>
      ));
    })}
  </group>
);

/** Torch / flashlight beam (additive cone). Points along -Y in local space. */
export const TorchBeam: React.FC<G & { len?: number; opacity?: number }> = ({ len = 10, opacity = 0.18, ...g }) => (
  <group {...g}>
    <mesh position={[0, -len / 2, 0]}>
      <cylinderGeometry args={[0.15, 2.4, len, 40, 1, true]} />
      <meshBasicMaterial color="#FFF3C4" transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  </group>
);
