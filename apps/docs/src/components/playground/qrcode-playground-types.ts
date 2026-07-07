import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMode,
  QRCodeVersion,
} from '@qrcodesdk/core';

export const QR_CODE_PLAYGROUND_UPDATE_EVENT = 'qrcodesdk:playground-update';

export type QRCodePlaygroundPackage = 'angular' | 'react';
export type QRCodePlaygroundOutput = 'svg' | 'image' | 'canvas';
export type QRCodePlaygroundColorHex = `#${string}`;

export type QRCodePlaygroundDraft = {
  packageName: QRCodePlaygroundPackage;
  output: QRCodePlaygroundOutput;
  data: string;
  mode: QRCodeMode | 'auto';
  version: QRCodeVersion | 'auto';
  errorCorrectionLevel: QRCodeErrorCorrectionLevel | 'auto';
  mask: QRCodeMask | 'auto';
  size: number;
  margin: number;
  colorDark: string;
  colorLight: string;
  title: string;
  ariaLabel: string;
  alt: string;
};

export type QRCodePlaygroundConfig = {
  packageName: QRCodePlaygroundPackage;
  output: QRCodePlaygroundOutput;
  data: string;
  options: {
    version?: QRCodeVersion;
    mode?: QRCodeMode;
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
    mask?: QRCodeMask;
    size: number;
    margin: number;
    colors: {
      colorDark: QRCodePlaygroundColorHex;
      colorLight: QRCodePlaygroundColorHex;
    };
    alt?: string;
    ariaLabel?: string;
    title?: string;
  };
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
