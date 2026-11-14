import sharp from 'sharp';

import {type QRCodeScan, decodeRMQRCode} from '../../src/decoder/node';

export {decodeRMQRCodeMatrix} from '../../src/decoder/node';

/** Scans an SVG as displayed on a white page. */
export async function decodeRMQRCodeSvg(svg: string): Promise<QRCodeScan> {
  const {data, info} = await sharp(Buffer.from(svg))
    .flatten({background: '#ffffff'})
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return decodeRMQRCode(new Uint8ClampedArray(data), info.width, info.height);
}
