import {fileURLToPath} from 'node:url';

/** The embedded copy of the logo that the image components use as their center image. */
export const centerLogo = {
  source: fileURLToPath(new URL('../assets/qrcodesdk-logo.png', import.meta.url)),
  module: fileURLToPath(new URL('../center-logo.ts', import.meta.url)),
  size: 128,
};
