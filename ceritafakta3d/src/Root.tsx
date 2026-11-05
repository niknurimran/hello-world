import React, { useEffect, useState } from 'react';
import { Composition } from 'remotion';
import { areFontsReady, fontsReady } from './fonts';
import { FPS, H, W } from './lib/theme';
import { V01_SotongKurita, V01_DURATION } from './videos/V01_SotongKurita';

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

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="V01-SotongKurita" component={V01} durationInFrames={Math.ceil(V01_DURATION * FPS)} fps={FPS} width={W} height={H} />
  </>
);
