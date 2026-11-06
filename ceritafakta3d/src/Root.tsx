import React, { useEffect, useState } from 'react';
import { Composition } from 'remotion';
import { areFontsReady, fontsReady } from './fonts';
import { FPS, H, W } from './lib/theme';
import { V01_SotongKurita, V01_DURATION } from './videos/V01_SotongKurita';
import { V02_Intro, V02_DURATION } from './videos/V02_Intro';
import { V03_Geletek, V03_DURATION } from './videos/V03_Geletek';
import { V04_Madu, V04_DURATION } from './videos/V04_Madu';

const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ok, setOk] = useState(areFontsReady());
  useEffect(() => {
    fontsReady.then(() => setOk(true));
  }, []);
  return ok ? <>{children}</> : null;
};

const V01 = () => (
  <FontGate>
    <V01_SotongKurita />
  </FontGate>
);

const V02 = () => (
  <FontGate>
    <V02_Intro />
  </FontGate>
);

const V03 = () => (
  <FontGate>
    <V03_Geletek />
  </FontGate>
);

const V04 = () => (
  <FontGate>
    <V04_Madu />
  </FontGate>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="V01-SotongKurita" component={V01} durationInFrames={Math.ceil(V01_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V02-Intro" component={V02} durationInFrames={Math.ceil(V02_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V03-Geletek" component={V03} durationInFrames={Math.ceil(V03_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V04-Madu" component={V04} durationInFrames={Math.ceil(V04_DURATION * FPS)} fps={FPS} width={W} height={H} />
  </>
);
