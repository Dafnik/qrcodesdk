import {type ReadResult, readBarcodes} from 'zxing-wasm/reader';

import type {QRCodeMatrix} from '@qrcodesdk/core';

/**
 * Decodes Micro QR codes with ZXing-C++, because jsQR cannot read them. Prepare the WebAssembly
 * binary first: Node.js tests import `@repo/core-testing/micro-decoder/node`, and browser tests call
 * `prepareZXingModule()` with the URL of `zxing-wasm/reader/zxing_reader.wasm`.
 */
export type MicroQRCodeScan = Pick<
  ReadResult,
  'text' | 'version' | 'ecLevel' | 'isMirrored' | 'format'
>;

/** Scans RGBA pixels for one Micro QR code and throws when none is found. */
export async function decodeMicroQRCode(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
): Promise<MicroQRCodeScan> {
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
  return decodeMicroQRCode(data, width, width);
}
