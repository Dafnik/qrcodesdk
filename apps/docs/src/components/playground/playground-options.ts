import {atom} from 'nanostores';

import {
  type QRCodeCanvasOptions,
  type QRCodeImageOptions,
  canvasCenterImage,
} from '@qrcodesdk/browser';
import {
  type QRCodeCenterImageLayout,
  type QRCodeDataImageURL,
  type QRCodeMatrixOptions,
  type QRCodeSVGOptions,
  type QRCodeVisualStyle,
  svgCenterImage,
} from '@qrcodesdk/core';

import {type PlaygroundStyleState, createPlaygroundStyle} from './playground-style.ts';

export type PlaygroundPackage = 'angular' | 'react' | 'svelte' | 'vue' | 'cli';
export type PlaygroundOutput = 'svg' | 'image' | 'canvas';
export type PlaygroundView = 'preview' | 'code';
export const PLAYGROUND_VIEWS = ['preview', 'code'] as const satisfies readonly PlaygroundView[];
export type PlaygroundSection = 'image' | 'styling' | 'accessibility';

export const PLAYGROUND_SECTIONS = [
  'image',
  'styling',
  'accessibility',
] as const satisfies readonly PlaygroundSection[];

export interface PlaygroundOptions extends QRCodeMatrixOptions, PlaygroundStyleState {
  payload: string;
  packageName: PlaygroundPackage;
  output: PlaygroundOutput;
  moduleSize?: number;
  quietZone?: number;
  foreground?: QRCodeVisualStyle['foreground'];
  background?: QRCodeVisualStyle['background'];
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

export const defaultPlaygroundOptions: PlaygroundOptions = {
  payload: 'https://qrcodesdk.dev',
  packageName: 'react',
  output: 'svg',
  eci: false,
  moduleSize: 8,
  quietZone: 4,
};

export const playgroundOptions = atom<PlaygroundOptions>(defaultPlaygroundOptions);
export const playgroundPreparedImage = atom<PlaygroundPreparedImage | undefined>(undefined);
export const playgroundImageStatus = atom<PlaygroundImageStatus>({state: 'idle'});
/** Selected preview panel. Kept apart from the options so resetting values keeps the view. */
export const playgroundView = atom<PlaygroundView>('preview');
/** Open control sections. Kept apart from the options so resetting values keeps the layout. */
export const playgroundOpenSections = atom<readonly PlaygroundSection[]>([]);

let imagePreparationVersion = 0;
const playgroundLogoPath = '/logo-square.png';
const playgroundLogoFileName = 'QRCodeSDK logo.png';

export function updateQrOptions(patch: Partial<PlaygroundOptions>): void {
  playgroundOptions.set({...playgroundOptions.get(), ...patch});
}

export function setPlaygroundSectionOpen(section: PlaygroundSection, open: boolean): void {
  const current = playgroundOpenSections.get();
  if (current.includes(section) === open) return;

  playgroundOpenSections.set(
    PLAYGROUND_SECTIONS.filter((candidate) =>
      candidate === section ? open : current.includes(candidate),
    ),
  );
}

export function resetQrOptions(): void {
  playgroundOptions.set({...defaultPlaygroundOptions});
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
    updateQrOptions({errorCorrectionLevel: 'H'});
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

export function playgroundCenterImageLayout(
  preparedImage: PlaygroundPreparedImage,
): QRCodeCenterImageLayout {
  return {
    size: preparedImage.size,
    padding: preparedImage.padding,
    clearBackground: preparedImage.clearBackground,
  };
}

export function createPlaygroundSVGOptions(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage = playgroundPreparedImage.get(),
): QRCodeSVGOptions {
  const rendererOptions = visualOptions(playgroundOptionsValue);
  return preparedImage
    ? {
        ...rendererOptions,
        centerImage: svgCenterImage(
          preparedImage.dataUrl,
          playgroundCenterImageLayout(preparedImage),
        ),
      }
    : rendererOptions;
}

export function createPlaygroundImageOptions(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage = playgroundPreparedImage.get(),
): QRCodeImageOptions {
  const rendererOptions = imageOptions(playgroundOptionsValue);
  return preparedImage
    ? {
        ...rendererOptions,
        centerImage: canvasCenterImage(
          preparedImage.element,
          playgroundCenterImageLayout(preparedImage),
        ),
      }
    : rendererOptions;
}

export function createPlaygroundCanvasOptions(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage = playgroundPreparedImage.get(),
): QRCodeCanvasOptions {
  const rendererOptions = visualOptions(playgroundOptionsValue);
  return preparedImage
    ? {
        ...rendererOptions,
        centerImage: canvasCenterImage(
          preparedImage.element,
          playgroundCenterImageLayout(preparedImage),
        ),
      }
    : rendererOptions;
}

function baseOptions(playgroundOptionsValue: PlaygroundOptions) {
  return {
    matrix: {
      version: playgroundOptionsValue.version,
      mode: playgroundOptionsValue.mode,
      errorCorrectionLevel: playgroundOptionsValue.errorCorrectionLevel,
      mask: playgroundOptionsValue.mask,
      eci: playgroundOptionsValue.eci,
    },
    style: {
      moduleSize: playgroundOptionsValue.moduleSize,
      quietZone: playgroundOptionsValue.quietZone,
      foreground: playgroundOptionsValue.foreground,
      background: playgroundOptionsValue.background,
      ...createPlaygroundStyle(playgroundOptionsValue),
    },
  };
}

function visualOptions(playgroundOptionsValue: PlaygroundOptions) {
  return {
    ...baseOptions(playgroundOptionsValue),
    accessibility: {
      ariaLabel: playgroundOptionsValue.ariaLabel,
      title: playgroundOptionsValue.title,
    },
  };
}

function imageOptions(playgroundOptionsValue: PlaygroundOptions): QRCodeImageOptions {
  return {
    ...baseOptions(playgroundOptionsValue),
    accessibility: {
      alt: playgroundOptionsValue.alt,
      ariaLabel: playgroundOptionsValue.ariaLabel,
      title: playgroundOptionsValue.title,
    },
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
