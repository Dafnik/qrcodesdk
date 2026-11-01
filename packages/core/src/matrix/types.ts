import type {QRCodeMask, QRCodeVersion} from '../types';

export type QRCodeCodeword = number;
export type QRCodeCodewords = QRCodeCodeword[];
export type QRCodePolynomial = QRCodeCodeword[];
export type QRCodeEncodedPayload = string | QRCodeCodewords;

export type QRCodeEncodedSegment = {
  readonly mode: QRCodeSupportedModeIndicator;
  readonly payload: QRCodeEncodedPayload;
};

export type QRCodeSupportedModeIndicator = 1 | 2 | 4;
export type QRCodeErrorCorrectionLevelValue = 0 | 1 | 2 | 3;

export type QRCodeResolvedMatrixOptions = {
  segments: readonly QRCodeEncodedSegment[];
  version: QRCodeVersion;
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue;
  mask: QRCodeMask | undefined;
  eci: boolean;
};
