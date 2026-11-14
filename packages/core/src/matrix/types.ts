import type {
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodePayload,
  QRCodeVersion,
} from '../types';

export type QRCodeCodeword = number;
export type QRCodeCodewords = QRCodeCodeword[];
export type QRCodePolynomial = QRCodeCodeword[];
export type QRCodeEncodedPayload = string | QRCodeCodewords;

export type QRCodeEncodedSegment = {
  readonly mode: QRCodeSupportedModeIndicator;
  readonly payload: QRCodeEncodedPayload;
};

export type QRCodeSupportedModeIndicator = 1 | 2 | 4 | 8;
export type QRCodeErrorCorrectionLevelValue = 0 | 1 | 2 | 3;

export type QRCodeResolvedMatrixOptions = {
  segments: readonly QRCodeEncodedSegment[];
  version: QRCodeVersion;
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue;
  mask: QRCodeMask | undefined;
  eci: boolean;
};

/** What a `QRCodeSymbol` is at runtime: the generator the builder calls instead of the standard one. */
export type QRCodeMatrixGenerator = (
  payload: QRCodePayload,
  options: QRCodeMatrixOptions,
) => QRCodeMatrix;
