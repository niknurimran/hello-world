import React, { useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { applyPose, CamPose } from '../lib/camera';
import { sceneFrames, WordsFile, Anchor } from '../lib/timing';
import { H, W } from '../lib/theme';
import { DARK_ENVS, Env, ENV_BG, EnvName } from '../envs/Env';
import { Chip } from './Chip';
import { Caption } from './Caption';
import { Tags, TagDef } from './Tag';
import { Flash } from './Flash';
import { Watermark } from './Watermark';

export type SceneProps = { t: number; d: number; f: number };
export type SceneDef = {
  chip: string;
  dot?: string;
  /** [caption line, word index] whose start the scene cuts on */
  anchor: Anchor;
  env: EnvName;
  cam: (t: number, d: number) => CamPose;
  world: (p: SceneProps) => React.ReactNode;
  tags?: TagDef[];
  overlay?: (p: SceneProps & { pose: CamPose }) => React.ReactNode;
  shadowScale?: number;
  decor?: boolean;
};

const DOTS = ['#3DDC84', '#EF4444', '#FFD23F', '#4CC9F0', '#FF7A45'];

const CameraRig: React.FC<{ pose: CamPose }> = ({ pose }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // set synchronously so the frame R3F renders after this always uses the right camera
  applyPose(camera, pose);
  useLayoutEffect(() => applyPose(camera, pose));
  return null;
};

export const VideoEngine: React.FC<{ scenes: SceneDef[]; data: WordsFile; audio: string; debugScene?: number }> = ({ scenes, data, audio }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ranges = useMemo(() => sceneFrames(data, scenes.map((s) => s.anchor), fps, durationInFrames), [data, scenes, fps, durationInFrames]);
  let idx = ranges.findIndex(([a, b]) => frame >= a && frame < b);
  if (idx < 0) idx = scenes.length - 1;
  const scene = scenes[idx];
  const [a, b] = ranges[idx];
  const p: SceneProps = { t: (frame - a) / fps, d: (b - a) / fps, f: frame - a };
  const pose = scene.cam(p.t, p.d);
  const time = frame / fps;
  const dark = DARK_ENVS.includes(scene.env);

  return (
    <AbsoluteFill style={{ background: ENV_BG[scene.env] }}>
      <ThreeCanvas
        width={W}
        height={H}
        dpr={1}
        shadows
        flat
        camera={{ manual: true, fov: 35, position: [0, 3, 10] } as never}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <CameraRig pose={pose} />
        <Env key={idx} env={scene.env} t={p.t} shadowScale={scene.shadowScale} decor={scene.decor}>
          {scene.world(p)}
        </Env>
      </ThreeCanvas>
      <AbsoluteFill>
        {scene.overlay?.({ ...p, pose })}
        {scene.tags && <Tags tags={scene.tags} pose={pose} t={p.t} />}
        <Chip key={`chip${idx}`} text={scene.chip} dot={scene.dot ?? DOTS[idx % DOTS.length]} t={p.t} />
        <Caption data={data} time={time} />
        <Watermark dark={dark} />
        {idx > 0 && <Flash f={p.f} />}
      </AbsoluteFill>
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};

/** Exposed for the stills script: where each scene starts. */
export const useSceneRanges = (scenes: SceneDef[], data: WordsFile) => {
  const { fps, durationInFrames } = useVideoConfig();
  return sceneFrames(data, scenes.map((s) => s.anchor), fps, durationInFrames);
};
void H;
