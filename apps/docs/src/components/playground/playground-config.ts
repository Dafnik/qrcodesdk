import {atom} from 'nanostores';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {
  QRCodeDataImageURL,
  QRCodeMatrixOptions,
  QRCodeSVGOptions,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

export type PlaygroundPackage = 'angular' | 'react' | 'svelte' | 'vue';
export type PlaygroundOutput = 'svg' | 'image' | 'canvas';

export interface PlaygroundConfig extends QRCodeMatrixOptions {
  data: string;
  packageName: PlaygroundPackage;
  output: PlaygroundOutput;
  moduleSize?: number;
  quietZone?: number;
  foreground?: QRCodeVisualStyle['foreground'];
  background?: QRCodeVisualStyle['background'];
  modules?: QRCodeVisualStyle['modules'];
  finder?: QRCodeVisualStyle['finder'];
  alt?: string;
  ariaLabel?: string;
  title?: string;
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
  moduleSize: 8,
  quietZone: 4,
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

    modules: mergeOptionalObject(current.modules, patch.modules, Object.hasOwn(patch, 'modules')),
    finder: mergeFinder(current.finder, patch.finder, Object.hasOwn(patch, 'finder')),
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
  const options = svgOptions(config);
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
  const options = imageOptions(config);
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
  const options = canvasOptions(config);
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

function baseOptions(config: PlaygroundConfig) {
  return {
    matrix: {
      version: config.version,
      mode: config.mode,
      errorCorrectionLevel: config.errorCorrectionLevel,
      mask: config.mask,
      eci: config.eci,
    },
    style: {
      moduleSize: config.moduleSize,
      quietZone: config.quietZone,
      foreground: config.foreground,
      background: config.background,
      modules: config.modules,
      finder: config.finder,
    },
  };
}

function svgOptions(config: PlaygroundConfig): QRCodeSVGOptions {
  return {
    ...baseOptions(config),
    accessibility: {ariaLabel: config.ariaLabel, title: config.title},
  };
}

function imageOptions(config: PlaygroundConfig): QRCodeImageOptions {
  return {
    ...baseOptions(config),
    accessibility: {alt: config.alt, ariaLabel: config.ariaLabel, title: config.title},
  };
}

function canvasOptions(config: PlaygroundConfig): QRCodeCanvasOptions {
  return {
    ...baseOptions(config),
    accessibility: {ariaLabel: config.ariaLabel, title: config.title},
  };
}

function mergeFinder(
  current: QRCodeVisualStyle['finder'],
  patch: QRCodeVisualStyle['finder'],
  isPresent: boolean,
): QRCodeVisualStyle['finder'] {
  const finder = mergeOptionalObject(current, patch, isPresent);
  if (!finder) return finder;
  return {
    ...finder,
    outer: mergeOptionalObject(
      current?.outer,
      patch?.outer,
      Boolean(patch && Object.hasOwn(patch, 'outer')),
    ),
    center: mergeOptionalObject(
      current?.center,
      patch?.center,
      Boolean(patch && Object.hasOwn(patch, 'center')),
    ),
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
