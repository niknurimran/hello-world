import React, { useEffect, useState } from 'react';
import { Composition } from 'remotion';
import { areFontsReady, fontsReady } from './fonts';
import { FPS, H, W } from './lib/theme';
import { V01_SotongKurita, V01_DURATION } from './videos/V01_SotongKurita';
import { V02_Intro, V02_DURATION } from './videos/V02_Intro';

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

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="V01-SotongKurita" component={V01} durationInFrames={Math.ceil(V01_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V02-Intro" component={V02} durationInFrames={Math.ceil(V02_DURATION * FPS)} fps={FPS} width={W} height={H} />
  </>
);
