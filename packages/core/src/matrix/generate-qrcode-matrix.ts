import type {QRCodeInputData, QRCodeMatrix, QRCodeMatrixOptions} from '../types';
import {assembleQRCodeMatrix} from './assemble-matrix';
import {createQRCodeCodewords} from './create-qrcode-codewords';
import {resolveQRCodeMatrixOptions} from './resolve-matrix-options';

export function generateQRCodeMatrix(
  data: QRCodeInputData,
  options?: QRCodeMatrixOptions,
): QRCodeMatrix {
  const resolved = resolveQRCodeMatrixOptions(data, options);
  const codewords = createQRCodeCodewords(resolved);
  return assembleQRCodeMatrix(
    resolved.version,
    resolved.errorCorrectionLevel,
    codewords,
    resolved.mask,
  );
}
