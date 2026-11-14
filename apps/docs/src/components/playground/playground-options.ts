import {atom} from 'nanostores';

import {
  type QRCodeCanvasOptions,
  type QRCodePNGImageOptions,
  canvasCenterImage,
} from '@qrcodesdk/browser';
import {
  type QRCodeCenterImageLayout,
  type QRCodeDataImageURL,
  type QRCodeMatrixOptions,
  type QRCodeSVGOptions,
  type QRCodeStandardMatrixOptions,
  type QRCodeVisualStyle,
  svgCenterImage,
} from '@qrcodesdk/core';
import {type QRCodeMicroMask, type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {
  applyWithPlaygroundKanji,
  playgroundKanjiTable,
  playgroundUsesKanji,
} from './playground-kanji.ts';
import {
  type PlaygroundShape,
  type PlaygroundStyleState,
  createPlaygroundStyle,
} from './playground-style.ts';

export type PlaygroundPackage = 'angular' | 'react' | 'svelte' | 'vue' | 'cli';
export type PlaygroundImageOutput = 'png' | 'webp' | 'gif' | 'jpeg';
export type PlaygroundOutput = 'svg' | PlaygroundImageOutput | 'canvas';
/** Options shared by the PNG, WebP, GIF, and JPEG components, plus the JPEG quality. */
export type PlaygroundImageOptions = QRCodePNGImageOptions & {readonly quality?: number};
/** The JPEG renderer's default quality, which generated code leaves out. */
export const DEFAULT_JPEG_QUALITY = 92;
export type PlaygroundView = 'preview' | 'code';
export const PLAYGROUND_VIEWS = ['preview', 'code'] as const satisfies readonly PlaygroundView[];
export type PlaygroundSection = 'image' | 'styling' | 'encoding' | 'accessibility';

export const PLAYGROUND_SECTIONS = [
  'image',
  'styling',
  'encoding',
  'accessibility',
] as const satisfies readonly PlaygroundSection[];

export interface PlaygroundOptions
  extends Omit<QRCodeStandardMatrixOptions, 'kanji'>, PlaygroundStyleState {
  /**
   * Generates a Micro QR code with `microQR()`, which also takes `mode`, the Kanji table, and the
   * error correction level. The standard `version`, `mask`, `eci`, and `optimizeSegments` values
   * are kept for switching back but not used.
   */
  micro?: boolean;
  microVersion?: QRCodeMicroVersion;
  microMask?: QRCodeMicroMask;
  microFallback?: boolean;
  optimizeSegments?: boolean;
  /** Passes the Kanji table so auto mode and optimized segments can use Kanji mode. */
  kanji?: boolean;
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
  /** JPEG quality from 1 to 100. Only JPEG output uses it. */
  quality?: number;
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

export {playgroundUsesKanji} from './playground-kanji.ts';

export function updateQrOptions(patch: Partial<PlaygroundOptions>): void {
  applyWithPlaygroundKanji(playgroundUsesKanji({...playgroundOptions.get(), ...patch}), () =>
    playgroundOptions.set({...playgroundOptions.get(), ...patch}),
  );
}

/** Replaces the playground options, after loading the Kanji table if they need it. */
export function setQrOptions(options: PlaygroundOptions): void {
  applyWithPlaygroundKanji(playgroundUsesKanji(options), () => playgroundOptions.set(options));
}

/** Default quiet zones of standard and Micro QR codes. */
const QUIET_ZONES = {standard: 4, micro: 2} as const;

/**
 * Switches between standard and Micro QR codes. A quiet zone at the previous symbol's default moves
 * to the new symbol's default, so switching keeps the recommended border.
 */
export function playgroundSymbolPatch(
  current: Pick<PlaygroundOptions, 'quietZone'>,
  micro: boolean,
): Partial<PlaygroundOptions> {
  const [from, to] = micro
    ? [QUIET_ZONES.standard, QUIET_ZONES.micro]
    : [QUIET_ZONES.micro, QUIET_ZONES.standard];
  return {micro, ...(current.quietZone === from ? {quietZone: to} : {})};
}

/**
 * ZXing cannot reliably locate the single finder pattern of a Micro QR code when its ring has a
 * corner radius of 0.5 or more. Square and diagonal rings scan.
 */
export function isUnreliableMicroFinderRing(shape: PlaygroundShape | undefined): boolean {
  return (
    shape === 'rounded' ||
    shape === 'extra-rounded' ||
    shape === 'diagonal-rounded' ||
    shape === 'circle'
  );
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
  setQrOptions({...defaultPlaygroundOptions});
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
      size: 0.3,
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
): PlaygroundImageOptions {
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

function matrixOptions(playgroundOptionsValue: PlaygroundOptions): QRCodeMatrixOptions {
  const {mode, errorCorrectionLevel} = playgroundOptionsValue;
  const kanji = playgroundUsesKanji(playgroundOptionsValue) ? playgroundKanjiTable() : undefined;
  if (playgroundOptionsValue.micro) {
    return {
      symbol: microQR({
        version: playgroundOptionsValue.microVersion,
        mask: playgroundOptionsValue.microMask,
        fallback: playgroundOptionsValue.microFallback,
      }),
      mode,
      kanji,
      errorCorrectionLevel,
    };
  }
  return {
    version: playgroundOptionsValue.version,
    mode,
    segmenter: playgroundOptionsValue.optimizeSegments ? automaticSegmenter : undefined,
    kanji,
    errorCorrectionLevel,
    mask: playgroundOptionsValue.mask,
    eci: playgroundOptionsValue.eci,
  };
}

function baseOptions(playgroundOptionsValue: PlaygroundOptions) {
  return {
    matrix: matrixOptions(playgroundOptionsValue),
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

export function isPlaygroundImageOutput(output: PlaygroundOutput): output is PlaygroundImageOutput {
  return output === 'png' || output === 'webp' || output === 'gif' || output === 'jpeg';
}

function imageOptions(playgroundOptionsValue: PlaygroundOptions): PlaygroundImageOptions {
  const {output, quality} = playgroundOptionsValue;
  return {
    ...baseOptions(playgroundOptionsValue),
    ...(output === 'jpeg' && quality !== undefined ? {quality} : {}),
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
