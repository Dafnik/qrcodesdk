import type {
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodePayload,
  QRCodeStandardMatrixOptions,
} from '../types';
import {assembleQRCodeMatrix} from './assemble-matrix';
import {createQRCodeCodewords} from './create-qrcode-codewords';
import {resolveQRCodeMatrixOptions} from './resolve-matrix-options';

export function generateQRCodeMatrix(
  payload: QRCodePayload,
  options?: QRCodeMatrixOptions,
): QRCodeMatrix {
  // The builder hands options with a `symbol` to that symbol's generator instead.
  const resolved = resolveQRCodeMatrixOptions(payload, options as QRCodeStandardMatrixOptions);
  const codewords = createQRCodeCodewords(resolved);
  return assembleQRCodeMatrix(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
  );
}
