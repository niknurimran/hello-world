import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setAudioCodec('aac');
Config.setPixelFormat('yuv420p');
Config.setChromiumOpenGlRenderer('angle');
Config.setOverwriteOutput(true);

// Optional: use an already-installed headless Chrome (e.g. on a machine that can't download one).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
