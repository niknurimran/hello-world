import * as THREE from 'three';
import { H, W } from './theme';
import { easeInOut, easeOutCubic, mix3, prog, V3 } from './easing';

export type CamPose = { pos: V3; target: V3; fov: number };

/** Content sits a little above frame centre so the caption (y≈1330) never covers it. */
export const VIEW_OFFSET_Y = 150;
/** Global framing: every scene camera sits this much further from its target than written. */
export const CAM_DIST = 1.45;

/** Slow dolly from `a` to `b` across the scene, plus a quick "whip" settle in the first 0.25 s. */
export const dolly = (a: CamPose, b: CamPose, opts: { whip?: number } = {}) =>
  (t: number, d: number): CamPose => {
    const p = easeInOut(t / d);
    const pos = mix3(a.pos, b.pos, p);
    const target = mix3(a.target, b.target, p);
    const whip = opts.whip ?? 0.12;
    const w = 1 - easeOutCubic(prog(t, 0, 0.3));
    // push the camera back along the view direction during the whip
    const dir: V3 = [pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]];
    return {
      pos: [pos[0] + dir[0] * whip * w, pos[1] + dir[1] * whip * w, pos[2] + dir[2] * whip * w],
      target,
      fov: a.fov + (b.fov - a.fov) * p,
    };
  };

/** Orbit around `target` from angle a0 to a1 (radians, 0 = +Z) at radius r and height y. */
export const orbit = (target: V3, r: number, y: number, a0: number, a1: number, fov = 35) =>
  (t: number, d: number): CamPose => {
    const a = a0 + (a1 - a0) * easeInOut(t / d);
    return { pos: [target[0] + Math.sin(a) * r, y, target[2] + Math.cos(a) * r], target, fov };
  };

export const applyPose = (cam: THREE.PerspectiveCamera, pose: CamPose) => {
  cam.fov = pose.fov;
  cam.aspect = W / H;
  cam.near = 0.1;
  cam.far = 200;
  cam.setViewOffset(W, H, 0, VIEW_OFFSET_Y, W, H);
  const [px, py, pz] = pose.pos, [tx, ty, tz] = pose.target;
  cam.position.set(tx + (px - tx) * CAM_DIST, ty + (py - ty) * CAM_DIST, tz + (pz - tz) * CAM_DIST);
  cam.up.set(0, 1, 0);
  cam.lookAt(...pose.target);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};

const scratch = new THREE.PerspectiveCamera();
const v = new THREE.Vector3();
/** Project a world point to composition pixels using the same camera maths as the 3D canvas. */
export const projectToScreen = (pose: CamPose, p: V3): { x: number; y: number; behind: boolean } => {
  applyPose(scratch, pose);
  v.set(...p).project(scratch);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, behind: v.z > 1 };
};
