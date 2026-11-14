import sharp from 'sharp';

import {type QRCodeScan, decodeMicroQRCode} from '../../src/decoder/node';

export {decodeMicroQRCodeMatrix} from '../../src/decoder/node';

/** Scans an SVG as displayed on a white page. */
export async function decodeMicroQRCodeSvg(svg: string): Promise<QRCodeScan> {
  const {data, info} = await sharp(Buffer.from(svg))
    .flatten({background: '#ffffff'})
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return decodeMicroQRCode(new Uint8ClampedArray(data), info.width, info.height);
}
