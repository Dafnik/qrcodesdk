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
  data: string;
  packageName: PlaygroundPackage;
  output: PlaygroundOutput;
}

export const defaultPlaygroundConfig: PlaygroundConfig = {
  data: 'https://qrcodesdk.dev',
  packageName: 'react',
  output: 'svg',
  size: 8,
  margin: 4,
};

export const playgroundConfig = atom<PlaygroundConfig>(defaultPlaygroundConfig);

function mergeOptionalObject<T extends object>(
  current: T | undefined,
  patch: T | undefined,
  isPresent: boolean,
): T | undefined {
  if (!isPresent) {
    return current;
  }

  if (patch === undefined) {
    return undefined;
  }

  return {
    ...current,
    ...patch,
  };
}

export function mergeQrConfig(
  current: PlaygroundConfig,
  patch: Partial<PlaygroundConfig>,
): PlaygroundConfig {
  return {
    ...current,
    ...patch,

    colors: mergeOptionalObject(current.colors, patch.colors, Object.hasOwn(patch, 'colors')),

    dotsOptions: mergeOptionalObject(
      current.dotsOptions,
      patch.dotsOptions,
      Object.hasOwn(patch, 'dotsOptions'),
    ),

    cornersSquareOptions: mergeOptionalObject(
      current.cornersSquareOptions,
      patch.cornersSquareOptions,
      Object.hasOwn(patch, 'cornersSquareOptions'),
    ),

    cornersDotOptions: mergeOptionalObject(
      current.cornersDotOptions,
      patch.cornersDotOptions,
      Object.hasOwn(patch, 'cornersDotOptions'),
    ),
  };
}

export function updateQrConfig(patch: Partial<PlaygroundConfig>): void {
  playgroundConfig.set(mergeQrConfig(playgroundConfig.get(), patch));
}

export function resetQrConfig(): void {
  playgroundConfig.set({...defaultPlaygroundConfig});
}
