import {type ReadResult, readBarcodes} from 'zxing-wasm/reader';

import type {QRCodeMatrix} from '@qrcodesdk/core';

/**
 * Decodes QR codes and Micro QR codes with ZXing-C++. Prepare the WebAssembly binary first: Node.js
 * tests import `@repo/core-testing/decoder/node`, and browser tests call `prepareZXingModule()` with
 * the URL of `zxing-wasm/reader/zxing_reader.wasm`.
 */
export type QRCodeScan = Pick<ReadResult, 'text' | 'version' | 'ecLevel' | 'isMirrored' | 'format'>;

/** ZXing's `QRCode` format includes every QR symbology, so standard scans ask for Model 2. */
export type QRCodeScanFormat = 'QRCodeModel2' | 'MicroQRCode';

/**
 * Scans RGBA pixels for one symbol of the given format and throws when none is found. Dark
 * modules must be on a light background: inverted symbols are not read.
 */
export async function decodeQRCode(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
  format: QRCodeScanFormat = 'QRCodeModel2',
): Promise<QRCodeScan> {
  const [result] = await readBarcodes(
    {data, width, height, colorSpace: 'srgb'},
    {
      formats: [format],
      tryHarder: true,
      tryInvert: false,
      maxNumberOfSymbols: 1,
      textMode: 'Plain',
    },
  );
  if (!result?.isValid) {
    throw new Error(`Unable to decode ${format} rendered to ${width}x${height} pixels`);
  }
  const {text, version, ecLevel, isMirrored} = result;
  return {text, version, ecLevel, isMirrored, format: result.format};
}

/** Scans RGBA pixels for one Micro QR code and throws when none is found. */
export function decodeMicroQRCode(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
): Promise<QRCodeScan> {
  return decodeQRCode(data, width, height, 'MicroQRCode');
}

/** Scans a Micro QR matrix drawn with 4-pixel modules and a quiet zone of 2 modules. */
export function decodeMicroQRCodeMatrix(matrix: QRCodeMatrix): Promise<QRCodeScan> {
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
