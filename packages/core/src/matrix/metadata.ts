import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMode,
  QRCodeModule,
  QRCodeVersion,
} from '../types';

export type QRCodeMatrixMetadataRole =
  | 'finder'
  | 'separator'
  | 'timing'
  | 'alignment'
  | 'format'
  | 'version'
  | 'dark-module'
  | 'mode'
  | 'character-count'
  | 'payload'
  | 'terminator'
  | 'padding'
  | 'error-correction'
  | 'remainder';

export type QRCodeEncodedBitMetadata = {
  readonly role: Extract<
    QRCodeMatrixMetadataRole,
    'mode' | 'character-count' | 'payload' | 'terminator' | 'padding' | 'error-correction'
  >;
  readonly bitIndex: number;
  readonly bitCount: number;
  readonly codewordIndex?: number;
};

export type QRCodeMatrixModuleMetadata = {
  readonly role: QRCodeMatrixMetadataRole;
  readonly groupId: string;
  readonly sourceValue?: QRCodeModule;
  readonly bitIndex?: number;
  readonly bitCount?: number;
  readonly codewordIndex?: number;
};

export type QRCodeMatrixGenerationMetadata = {
  readonly matrix: QRCodeMatrix;
  readonly moduleGrid: readonly (readonly QRCodeMatrixModuleMetadata[])[];
  readonly version: QRCodeVersion;
  readonly mode: QRCodeMode | 'mixed';
  readonly errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  readonly mask: QRCodeMask;
};
