import type {
  QRCodeAccessibilityOptions,
  QRCodeCornerDotType,
  QRCodeCornerSquareType,
  QRCodeDotType,
  QRCodeMatrixOptions,
  QRCodeStylingOptions,
} from '@qrcodesdk/core';

export const QR_CODE_PLAYGROUND_UPDATE_EVENT = 'qrcodesdk:playground-update';

export type QRCodePlaygroundPackage = 'angular' | 'react';
export type QRCodePlaygroundOutput = 'svg' | 'image' | 'canvas';

type QRCodePlaygroundMatrixDraft = {
  [TKey in keyof QRCodeMatrixOptions]-?: NonNullable<QRCodeMatrixOptions[TKey]> | 'auto';
};

export type QRCodePlaygroundDraft = QRCodePlaygroundMatrixDraft &
  Required<QRCodeAccessibilityOptions> & {
    packageName: QRCodePlaygroundPackage;
    output: QRCodePlaygroundOutput;
    data: string;
    size: number;
    margin: number;
    colorDark: string;
    colorLight: string;
    dotsType: QRCodeDotType;
    dotsColor?: string;
    cornersSquareType: QRCodeCornerSquareType;
    cornersSquareColor?: string;
    cornersDotType: QRCodeCornerDotType;
    cornersDotColor?: string;
  };

export type QRCodePlaygroundConfig = {
  packageName: QRCodePlaygroundPackage;
  output: QRCodePlaygroundOutput;
  data: string;
  options: QRCodeMatrixOptions & QRCodeStylingOptions & QRCodeAccessibilityOptions;
};

export type QRCodePlaygroundValidation = {
  valid: boolean;
  error?: string;
  fieldErrors: Partial<
    Record<
      | 'colorDark'
      | 'colorLight'
      | 'dotsColor'
      | 'cornersSquareColor'
      | 'cornersDotColor'
      | 'size'
      | 'margin',
      string
    >
  >;
};

export type QRCodePlaygroundSnapshot = {
  draft: QRCodePlaygroundDraft;
  config?: QRCodePlaygroundConfig;
  validation: QRCodePlaygroundValidation;
};

declare global {
  interface WindowEventMap {
    [QR_CODE_PLAYGROUND_UPDATE_EVENT]: CustomEvent<QRCodePlaygroundSnapshot>;
  }
}
