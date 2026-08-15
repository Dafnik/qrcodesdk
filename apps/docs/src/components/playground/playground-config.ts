import {atom} from 'nanostores';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {
  QRCodeAccessibilityOptions,
  QRCodeDataImageURL,
  QRCodeMatrixOptions,
  QRCodeSVGOptions,
  QRCodeStylingOptions,
} from '@qrcodesdk/core';

export type PlaygroundPackage = 'angular' | 'react' | 'vue';
export type PlaygroundOutput = 'svg' | 'image' | 'canvas';

export interface PlaygroundConfig
  extends QRCodeMatrixOptions, QRCodeStylingOptions, QRCodeAccessibilityOptions {
  data: string;
  packageName: PlaygroundPackage;
  output: PlaygroundOutput;
}

export interface PlaygroundPreparedImage {
  dataUrl: QRCodeDataImageURL;
  element: HTMLImageElement;
  fileName: string;
  size: number;
  padding: number;
  clearBackground: boolean;
}

export type PlaygroundImageStatus =
  | {state: 'idle'}
  | {state: 'loading'; fileName: string}
  | {state: 'ready'}
  | {state: 'error'; message: string};

export const defaultPlaygroundConfig: PlaygroundConfig = {
  data: 'https://qrcodesdk.dev',
  packageName: 'react',
  output: 'svg',
  eci: false,
  size: 8,
  margin: 4,
};

export const playgroundConfig = atom<PlaygroundConfig>(defaultPlaygroundConfig);
export const playgroundPreparedImage = atom<PlaygroundPreparedImage | undefined>(undefined);
export const playgroundImageStatus = atom<PlaygroundImageStatus>({state: 'idle'});

let imagePreparationVersion = 0;
const playgroundLogoPath = '/logo-square.png';
const playgroundLogoFileName = 'QRCodeSDK logo.png';

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
  clearPlaygroundImage();
}

export async function preparePlaygroundImage(file: File): Promise<void> {
  const preparationVersion = ++imagePreparationVersion;
  playgroundImageStatus.set({state: 'loading', fileName: file.name});

  await preparePlaygroundImageFile(file, preparationVersion);
}

export async function preparePlaygroundLogo(fetchImage: typeof fetch = fetch): Promise<void> {
  const preparationVersion = ++imagePreparationVersion;
  playgroundImageStatus.set({state: 'loading', fileName: playgroundLogoFileName});

  try {
    const response = await fetchImage(playgroundLogoPath);
    if (!response.ok) {
      throw new Error('The QRCodeSDK logo could not be loaded.');
    }

    const file = new File([await response.blob()], playgroundLogoFileName, {type: 'image/png'});
    if (preparationVersion !== imagePreparationVersion) return;

    await preparePlaygroundImageFile(file, preparationVersion);
  } catch (error) {
    setPlaygroundImageError(preparationVersion, error);
  }
}

async function preparePlaygroundImageFile(file: File, preparationVersion: number): Promise<void> {
  try {
    const dataUrl = await readFileAsDataImageURL(file);
    const element = await loadPreparedImage(dataUrl);
    if (preparationVersion !== imagePreparationVersion) return;

    playgroundPreparedImage.set({
      dataUrl,
      element,
      fileName: file.name,
      size: 0.4,
      padding: 1,
      clearBackground: true,
    });
    playgroundImageStatus.set({state: 'ready'});
    updateQrConfig({errorCorrectionLevel: 'H'});
  } catch (error) {
    setPlaygroundImageError(preparationVersion, error);
  }
}

function setPlaygroundImageError(preparationVersion: number, error: unknown): void {
  if (preparationVersion !== imagePreparationVersion) return;

  playgroundPreparedImage.set(undefined);
  playgroundImageStatus.set({
    state: 'error',
    message: error instanceof Error ? error.message : 'The selected image could not be prepared.',
  });
}

export function updatePlaygroundImage(
  patch: Partial<Pick<PlaygroundPreparedImage, 'size' | 'padding' | 'clearBackground'>>,
): void {
  const current = playgroundPreparedImage.get();
  if (!current) return;

  playgroundPreparedImage.set({...current, ...patch});
}

export function clearPlaygroundImage(): void {
  imagePreparationVersion++;
  playgroundPreparedImage.set(undefined);
  playgroundImageStatus.set({state: 'idle'});
}

export function createPlaygroundSVGOptions(
  config: PlaygroundConfig,
  preparedImage = playgroundPreparedImage.get(),
): QRCodeSVGOptions {
  const options = rendererOptions(config);
  return preparedImage
    ? {
        ...options,
        image: {
          source: preparedImage.dataUrl,
          size: preparedImage.size,
          padding: preparedImage.padding,
          clearBackground: preparedImage.clearBackground,
        },
      }
    : options;
}

export function createPlaygroundImageOptions(
  config: PlaygroundConfig,
  preparedImage = playgroundPreparedImage.get(),
): QRCodeImageOptions {
  const options = rendererOptions(config);
  return preparedImage
    ? {
        ...options,
        image: {
          source: preparedImage.element,
          size: preparedImage.size,
          padding: preparedImage.padding,
          clearBackground: preparedImage.clearBackground,
        },
      }
    : options;
}

export function createPlaygroundCanvasOptions(
  config: PlaygroundConfig,
  preparedImage = playgroundPreparedImage.get(),
): QRCodeCanvasOptions {
  const options = rendererOptions(config);
  return preparedImage
    ? {
        ...options,
        image: {
          source: preparedImage.element,
          size: preparedImage.size,
          padding: preparedImage.padding,
          clearBackground: preparedImage.clearBackground,
        },
      }
    : options;
}

function rendererOptions(config: PlaygroundConfig) {
  return {
    version: config.version,
    mode: config.mode,
    errorCorrectionLevel: config.errorCorrectionLevel,
    mask: config.mask,
    eci: config.eci,
    size: config.size,
    margin: config.margin,
    colors: config.colors,
    dotsOptions: config.dotsOptions,
    cornersSquareOptions: config.cornersSquareOptions,
    cornersDotOptions: config.cornersDotOptions,
    alt: config.alt,
    ariaLabel: config.ariaLabel,
    title: config.title,
  };
}

function readFileAsDataImageURL(file: File): Promise<QRCodeDataImageURL> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Choose an image file.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          resolve(reader.result as QRCodeDataImageURL);
        } else {
          reject(new Error('The selected file did not produce an embedded image.'));
        }
      },
      {once: true},
    );
    reader.addEventListener('error', () => reject(new Error('The image file could not be read.')), {
      once: true,
    });
    reader.addEventListener('abort', () => reject(new Error('Image preparation was cancelled.')), {
      once: true,
    });
    reader.readAsDataURL(file);
  });
}

async function loadPreparedImage(dataUrl: QRCodeDataImageURL): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = dataUrl;

  try {
    await image.decode();
  } catch {
    throw new Error('The selected image could not be decoded by this browser.');
  }

  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new Error('The selected image has no usable dimensions.');
  }

  return image;
}
