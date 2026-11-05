import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Tube with varying radius whose path is re-evaluated every frame (tentacles, pipes).
 * points: polyline (>= 2), radius(s) where s∈[0,1]; colorAt(s) optional vertex colours.
 */
export const TaperTube: React.FC<{
  points: THREE.Vector3[];
  radius: (s: number) => number;
  colorAt?: (s: number, out: THREE.Color) => void;
  radial?: number;
  material: React.ReactNode;
  castShadow?: boolean;
}> = ({ points, radius, colorAt, radial = 10, material, castShadow = true }) => {
  const n = points.length;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const vCount = n * (radial + 1) + 1;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vCount * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vCount * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vCount * 3).fill(1), 3));
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++)
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j, b = a + radial + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const tip = n * (radial + 1);
    for (let j = 0; j < radial; j++) idx.push((n - 1) * (radial + 1) + j, tip, (n - 1) * (radial + 1) + j + 1);
    g.setIndex(idx);
    return g;
  }, [n, radial]);

  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
  const col = geo.getAttribute('color') as THREE.BufferAttribute;
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3();
  const c = new THREE.Color();
  let prevN: THREE.Vector3 | null = null;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    T.subVectors(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]).normalize();
    if (!prevN) {
      if (Math.abs(T.dot(ref)) > 0.9) ref.set(1, 0, 0);
      N.crossVectors(T, ref).normalize();
    } else {
      // parallel transport
      N.copy(prevN).sub(v.copy(T).multiplyScalar(prevN.dot(T))).normalize();
    }
    prevN = N.clone();
    B.crossVectors(T, N).normalize();
    const r = radius(s);
    if (colorAt) colorAt(s, c);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      v.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      const k = i * (radial + 1) + j;
      nor.setXYZ(k, v.x, v.y, v.z);
      pos.setXYZ(k, points[i].x + v.x * r, points[i].y + v.y * r, points[i].z + v.z * r);
      if (colorAt) col.setXYZ(k, c.r, c.g, c.b);
    }
  }
  const tip = n * (radial + 1);
  const last = points[n - 1];
  pos.setXYZ(tip, last.x + T.x * radius(1), last.y + T.y * radius(1), last.z + T.z * radius(1));
  nor.setXYZ(tip, T.x, T.y, T.z);
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  col.needsUpdate = true;
  geo.computeBoundingSphere();

  return (
    <mesh geometry={geo} castShadow={castShadow}>
      {material}
    </mesh>
  );
};
