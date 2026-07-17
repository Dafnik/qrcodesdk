import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrixOptions,
  QRCodeParsedStylingOptions,
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
  };

export type QRCodePlaygroundConfig = {
  packageName: QRCodePlaygroundPackage;
  output: QRCodePlaygroundOutput;
  data: string;
  options: QRCodeMatrixOptions & QRCodeParsedStylingOptions & QRCodeAccessibilityOptions;
};

export type QRCodePlaygroundValidation = {
  valid: boolean;
  error?: string;
  fieldErrors: Partial<Record<'colorDark' | 'colorLight' | 'size' | 'margin', string>>;
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
