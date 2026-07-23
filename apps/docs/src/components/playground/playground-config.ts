import {atom} from 'nanostores';

import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrixOptions,
  QRCodeStylingOptions,
} from '@qrcodesdk/core';

export type PlaygroundPackage = 'angular' | 'react';
export type PlaygroundOutput = 'svg' | 'image' | 'canvas';

export interface PlaygroundConfig
  extends QRCodeMatrixOptions, QRCodeStylingOptions, QRCodeAccessibilityOptions {
  value: string;
  packageName: PlaygroundPackage;
  output: PlaygroundOutput;
}

export const defaultQrConfig: PlaygroundConfig = {
  value: 'https://qrcodesdk.dev',
  packageName: 'react',
  output: 'svg',
};

export const qrConfig = atom<PlaygroundConfig>(defaultQrConfig);

export function mergeQrConfig(
  current: PlaygroundConfig,
  patch: Partial<PlaygroundConfig>,
): PlaygroundConfig {
  return {
    ...current,
    ...patch,

    colors:
      patch.colors === undefined
        ? current.colors
        : {
            ...current.colors,
            ...patch.colors,
          },

    dotsOptions:
      patch.dotsOptions === undefined
        ? current.dotsOptions
        : {
            ...current.dotsOptions,
            ...patch.dotsOptions,
          },

    cornersSquareOptions:
      patch.cornersSquareOptions === undefined
        ? current.cornersSquareOptions
        : {
            ...current.cornersSquareOptions,
            ...patch.cornersSquareOptions,
          },

    cornersDotOptions:
      patch.cornersDotOptions === undefined
        ? current.cornersDotOptions
        : {
            ...current.cornersDotOptions,
            ...patch.cornersDotOptions,
          },
  };
}

export function updateQrConfig(patch: Partial<PlaygroundConfig>): void {
  qrConfig.set(mergeQrConfig(qrConfig.get(), patch));
}

export function resetQrConfig(): void {
  qrConfig.set({...defaultQrConfig});
}
