import type {QRCodeMatrix, QRCodeMatrixOptions, QRCodePayload} from '../types';
import {assembleQRCodeMatrix} from './assemble-matrix';
import {createQRCodeCodewords} from './create-qrcode-codewords';
import {resolveQRCodeMatrixOptions} from './resolve-matrix-options';

export function generateQRCodeMatrix(
  payload: QRCodePayload,
  options?: QRCodeMatrixOptions,
): QRCodeMatrix {
  const resolved = resolveQRCodeMatrixOptions(payload, options);
  const codewords = createQRCodeCodewords(resolved);
  return assembleQRCodeMatrix(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
  );
}
