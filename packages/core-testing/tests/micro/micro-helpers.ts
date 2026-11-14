import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import sharp from 'sharp';
import {type ReadResult, prepareZXingModule, readBarcodes} from 'zxing-wasm/reader';

import type {QRCodeMatrix} from '@qrcodesdk/core';

// jsQR cannot read Micro QR codes, so these tests use ZXing-C++ with its local WebAssembly binary.
const wasmBinary = readFileSync(
  createRequire(import.meta.url).resolve('zxing-wasm/reader/zxing_reader.wasm'),
);
prepareZXingModule({
  overrides: {
    wasmBinary: wasmBinary.buffer.slice(
      wasmBinary.byteOffset,
      wasmBinary.byteOffset + wasmBinary.byteLength,
    ) as ArrayBuffer,
  },
});

export type MicroQRCodeScan = Pick<
  ReadResult,
  'text' | 'version' | 'ecLevel' | 'isMirrored' | 'format'
>;

async function decode(data: Uint8ClampedArray<ArrayBuffer>, width: number, height: number) {
  const [result] = await readBarcodes(
    {data, width, height, colorSpace: 'srgb'},
    {formats: ['MicroQRCode'], tryHarder: true, maxNumberOfSymbols: 1},
  );
  if (!result?.isValid) {
    throw new Error(`Unable to decode Micro QR code rendered to ${width}x${height} pixels`);
  }
  const {text, version, ecLevel, isMirrored, format} = result;
  return {text, version, ecLevel, isMirrored, format};
}

/** Scans a matrix drawn with 4-pixel modules and a quiet zone of 2 modules. */
export function decodeMicroQRCodeMatrix(matrix: QRCodeMatrix): Promise<MicroQRCodeScan> {
  const scale = 4;
  const width = (matrix.size + 4) * scale;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const row = Math.floor(y / scale) - 2;
      const column = Math.floor(x / scale) - 2;
      if (
        row >= 0 &&
        column >= 0 &&
        row < matrix.size &&
        column < matrix.size &&
        matrix.modules[row * matrix.size + column]
      ) {
        data.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 3);
      }
    }
  }
  return decode(data, width, width);
}

/** Scans an SVG as displayed on a white page. */
export async function decodeMicroQRCodeSvg(svg: string): Promise<MicroQRCodeScan> {
  const {data, info} = await sharp(Buffer.from(svg))
    .flatten({background: '#ffffff'})
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return decode(new Uint8ClampedArray(data), info.width, info.height);
}
