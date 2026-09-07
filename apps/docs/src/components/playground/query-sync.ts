import type {
  QRCodeColor,
  QRCodeFinderShape,
  QRCodeMask,
  QRCodeModuleShape,
  QRCodeVersion,
} from '@qrcodesdk/core';

import {
  type PlaygroundOptions,
  type PlaygroundOutput,
  type PlaygroundPackage,
  defaultPlaygroundOptions,
  playgroundOptions,
} from './playground-options.ts';

const PLAYGROUND_PACKAGES = [
  'angular',
  'react',
  'svelte',
  'vue',
] as const satisfies readonly PlaygroundPackage[];

const PLAYGROUND_OUTPUTS = [
  'svg',
  'image',
  'canvas',
] as const satisfies readonly PlaygroundOutput[];
const MODES = ['numeric', 'alphanumeric', 'octet'] as const;
const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const;
const MODULE_SHAPES = [
  'square',
  'circle',
  'rounded',
  'extra-rounded',
  'diagonal',
  'diagonal-rounded',
] as const satisfies readonly QRCodeModuleShape[];
const FINDER_SHAPES = [
  'square',
  'rounded',
  'extra-rounded',
  'circle',
] as const satisfies readonly QRCodeFinderShape[];

interface QueryFieldCodec {
  readonly key: string;
  read(
    params: URLSearchParams,
    fallback: PlaygroundOptions,
    currentOptions: PlaygroundOptions,
  ): void;
  write(
    params: URLSearchParams,
    currentOptions: PlaygroundOptions,
    defaults: PlaygroundOptions | undefined,
  ): void;
}

const QUERY_FIELD_CODECS = [
  defineQueryField(
    'payload',
    (options) => options.payload,
    (options, payload) => {
      options.payload = payload;
    },
    parseRequiredString,
    serializeString,
  ),
  defineQueryField(
    'package',
    (currentOptions) => currentOptions.packageName,
    (currentOptions, packageName) => {
      currentOptions.packageName = packageName;
    },
    (value, fallback) => parseStringUnion(value, PLAYGROUND_PACKAGES, fallback),
    serializeString,
  ),
  defineQueryField(
    'output',
    (currentOptions) => currentOptions.output,
    (currentOptions, output) => {
      currentOptions.output = output;
    },
    (value, fallback) => parseStringUnion(value, PLAYGROUND_OUTPUTS, fallback),
    serializeString,
  ),
  defineQueryField(
    'version',
    (currentOptions) => currentOptions.version,
    (currentOptions, version) => setOptionalProperty(currentOptions, 'version', version),
    (value, fallback) => parseOptionalNumber(value, isQRCodeVersion, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'mode',
    (currentOptions) => currentOptions.mode,
    (currentOptions, mode) => setOptionalProperty(currentOptions, 'mode', mode),
    (value, fallback) => parseOptionalStringUnion(value, MODES, fallback),
    serializeString,
  ),
  defineQueryField(
    'level',
    (currentOptions) => currentOptions.errorCorrectionLevel,
    (currentOptions, errorCorrectionLevel) =>
      setOptionalProperty(currentOptions, 'errorCorrectionLevel', errorCorrectionLevel),
    (value, fallback) => parseOptionalStringUnion(value, ERROR_CORRECTION_LEVELS, fallback),
    serializeString,
  ),
  defineQueryField(
    'mask',
    (currentOptions) => currentOptions.mask,
    (currentOptions, mask) => setOptionalProperty(currentOptions, 'mask', mask),
    (value, fallback) => parseOptionalNumber(value, isQRCodeMask, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'eci',
    (currentOptions) => currentOptions.eci ?? false,
    (currentOptions, eci) => {
      currentOptions.eci = eci;
    },
    parseBoolean,
    serializeBoolean,
  ),
  defineQueryField(
    'module-size',
    (currentOptions) => currentOptions.moduleSize,
    (currentOptions, moduleSize) => setOptionalProperty(currentOptions, 'moduleSize', moduleSize),
    (value, fallback) => parseOptionalNumber(value, isPositiveInteger, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'quiet-zone',
    (currentOptions) => currentOptions.quietZone,
    (currentOptions, quietZone) => setOptionalProperty(currentOptions, 'quietZone', quietZone),
    (value, fallback) => parseOptionalNumber(value, isNonNegativeInteger, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'background',
    (currentOptions) => currentOptions.background,
    (currentOptions, background) => setOptionalProperty(currentOptions, 'background', background),
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'foreground',
    (currentOptions) => currentOptions.foreground,
    (currentOptions, foreground) => setOptionalProperty(currentOptions, 'foreground', foreground),
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'modules-color',
    (currentOptions) => currentOptions.modules?.color,
    (currentOptions, color) => {
      currentOptions.modules = compactObject({...currentOptions.modules, color});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'modules-shape',
    (currentOptions) => currentOptions.modules?.shape,
    (currentOptions, shape) => {
      currentOptions.modules = compactObject({...currentOptions.modules, shape});
    },
    (value, fallback) => parseOptionalStringUnion(value, MODULE_SHAPES, fallback),
    serializeString,
  ),
  defineQueryField(
    'finder-outer-color',
    (currentOptions) => currentOptions.finder?.outer?.color,
    (currentOptions, color) => {
      currentOptions.finder = {
        ...currentOptions.finder,
        outer: compactObject({...currentOptions.finder?.outer, color}),
      };
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'finder-outer-shape',
    (currentOptions) => currentOptions.finder?.outer?.shape,
    (currentOptions, shape) => {
      currentOptions.finder = {
        ...currentOptions.finder,
        outer: compactObject({...currentOptions.finder?.outer, shape}),
      };
    },
    (value, fallback) => parseOptionalStringUnion(value, FINDER_SHAPES, fallback),
    serializeString,
  ),
  defineQueryField(
    'finder-center-color',
    (currentOptions) => currentOptions.finder?.center?.color,
    (currentOptions, color) => {
      currentOptions.finder = {
        ...currentOptions.finder,
        center: compactObject({...currentOptions.finder?.center, color}),
      };
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'finder-center-shape',
    (currentOptions) => currentOptions.finder?.center?.shape,
    (currentOptions, shape) => {
      currentOptions.finder = {
        ...currentOptions.finder,
        center: compactObject({...currentOptions.finder?.center, shape}),
      };
    },
    (value, fallback) => parseOptionalStringUnion(value, FINDER_SHAPES, fallback),
    serializeString,
  ),
  defineQueryField(
    'alt',
    (currentOptions) => currentOptions.alt,
    (currentOptions, alt) => setOptionalProperty(currentOptions, 'alt', alt),
    parseOptionalString,
    serializeString,
  ),
  defineQueryField(
    'aria-label',
    (currentOptions) => currentOptions.ariaLabel,
    (currentOptions, ariaLabel) => setOptionalProperty(currentOptions, 'ariaLabel', ariaLabel),
    parseOptionalString,
    serializeString,
  ),
  defineQueryField(
    'title',
    (currentOptions) => currentOptions.title,
    (currentOptions, title) => setOptionalProperty(currentOptions, 'title', title),
    parseOptionalString,
    serializeString,
  ),
] as const satisfies readonly QueryFieldCodec[];

export interface QrQuerySyncOptions {
  /**
   * Delay before store changes are reflected in the URL.
   */
  debounceMs?: number;

  /**
   * Remove values that equal `defaultPlaygroundOptions`.
   */
  omitDefaults?: boolean;
}

export interface WriteQrOptionsToUrlOptions {
  omitDefaults?: boolean;
}

let activeCleanup: (() => void) | undefined;

/**
 * Starts two-way synchronization between `qrOptions` and the current URL.
 *
 * Initial URL values overwrite the store. Subsequent store changes update
 * the URL with `replaceState`. Browser Back and Forward navigation updates
 * the store through `popstate`.
 */
export function startQrQuerySync(options: QrQuerySyncOptions = {}): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (activeCleanup) {
    return activeCleanup;
  }

  const {debounceMs = 150, omitDefaults = true} = options;

  let applyingUrlState = true;
  let updateTimer: ReturnType<typeof setTimeout> | undefined;

  playgroundOptions.set(readQrOptionsFromUrl());

  applyingUrlState = false;

  const unsubscribe = playgroundOptions.subscribe((currentOptions) => {
    if (applyingUrlState) {
      return;
    }

    clearTimeout(updateTimer);

    updateTimer = setTimeout(() => {
      writeQrOptionsToUrl(currentOptions, {
        omitDefaults,
      });
    }, debounceMs);
  });

  const handlePopState = (): void => {
    clearTimeout(updateTimer);
    applyingUrlState = true;

    try {
      playgroundOptions.set(readQrOptionsFromUrl());
    } finally {
      applyingUrlState = false;
    }
  };

  window.addEventListener('popstate', handlePopState);

  activeCleanup = () => {
    clearTimeout(updateTimer);
    unsubscribe();
    window.removeEventListener('popstate', handlePopState);
    activeCleanup = undefined;
  };

  return activeCleanup;
}

/**
 * Reads the current browser URL into a validated playground options.
 */
export function readQrOptionsFromUrl(
  fallback: PlaygroundOptions = defaultPlaygroundOptions,
): PlaygroundOptions {
  if (typeof window === 'undefined') {
    return clonePlaygroundOptions(fallback);
  }

  return readQrOptionsFromSearchParams(new URLSearchParams(window.location.search), fallback);
}

/**
 * Parses a URLSearchParams instance into a validated playground options.
 */
export function readQrOptionsFromSearchParams(
  params: URLSearchParams,
  fallback: PlaygroundOptions = defaultPlaygroundOptions,
): PlaygroundOptions {
  const currentOptions = clonePlaygroundOptions(fallback);

  for (const codec of QUERY_FIELD_CODECS) {
    codec.read(params, fallback, currentOptions);
  }

  return currentOptions;
}

/**
 * Writes a playground options to the current browser URL.
 *
 * Query parameters not owned by the playground are preserved.
 */
export function writeQrOptionsToUrl(
  currentOptions: PlaygroundOptions,
  options: WriteQrOptionsToUrlOptions = {},
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const {omitDefaults = true} = options;

  const url = new URL(window.location.href);

  writeQrOptionsToSearchParams(
    url.searchParams,
    currentOptions,
    omitDefaults ? defaultPlaygroundOptions : undefined,
  );

  if (url.href === window.location.href) {
    return;
  }

  window.history.replaceState(window.history.state, '', url);
}

/**
 * Writes the options into an existing URLSearchParams instance.
 *
 * Only playground-owned parameters are modified. Other parameters remain.
 */
export function writeQrOptionsToSearchParams(
  params: URLSearchParams,
  currentOptions: PlaygroundOptions,
  defaults?: PlaygroundOptions,
): URLSearchParams {
  for (const codec of QUERY_FIELD_CODECS) {
    codec.write(params, currentOptions, defaults);
  }

  return params;
}

function defineQueryField<T>(
  key: string,
  getValue: (currentOptions: PlaygroundOptions) => T,
  setValue: (currentOptions: PlaygroundOptions, value: T) => void,
  parse: (value: string | null, fallback: T) => T,
  serialize: (value: T, defaultValue: T | undefined) => string | undefined,
): QueryFieldCodec {
  return {
    key,
    read(params, fallback, currentOptions) {
      setValue(currentOptions, parse(params.get(key), getValue(fallback)));
    },
    write(params, currentOptions, defaults) {
      const defaultValue = defaults === undefined ? undefined : getValue(defaults);
      const value = serialize(getValue(currentOptions), defaultValue);

      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    },
  };
}

function parseRequiredString(value: string | null, fallback: string): string {
  return value ?? fallback;
}

function parseStringUnion<const T extends string>(
  value: string | null,
  supportedValues: readonly T[],
  fallback: T,
): T {
  if (value !== null && supportedValues.includes(value as T)) {
    return value as T;
  }

  return fallback;
}

function parseOptionalStringUnion<const T extends string>(
  value: string | null,
  supportedValues: readonly T[],
  fallback: T | undefined,
): T | undefined {
  if (value === null) {
    return fallback;
  }

  return supportedValues.includes(value as T) ? (value as T) : fallback;
}

function parseOptionalNumber<T extends number>(
  value: string | null,
  guard: (value: unknown) => value is T,
  fallback: T | undefined,
): T | undefined {
  if (value === null || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  return guard(parsed) ? parsed : fallback;
}

function parseOptionalColor(
  value: string | null,
  fallback: QRCodeColor | undefined,
): QRCodeColor | undefined {
  if (value === null || value.trim() === '') {
    return fallback;
  }

  const normalized = value.startsWith('#') ? value : `#${value}`;

  if (!isQRCodeColor(normalized)) {
    return fallback;
  }

  return normalized.toLowerCase() as QRCodeColor;
}

function parseOptionalString(
  value: string | null,
  fallback: string | undefined,
): string | undefined {
  if (value === null) {
    return fallback;
  }
  return value === '' ? undefined : value;
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function serializeString(
  value: string | undefined,
  defaultValue: string | undefined,
): string | undefined {
  if (value === undefined || value === '' || value === defaultValue) {
    return undefined;
  }

  return value;
}

function serializeNumber(
  value: number | undefined,
  defaultValue: number | undefined,
): string | undefined {
  if (value === undefined || value === defaultValue) {
    return undefined;
  }

  return String(value);
}

function serializeBoolean(value: boolean, defaultValue: boolean | undefined): string | undefined {
  if (value === defaultValue) return undefined;
  return String(value);
}

function serializeColor(
  value: QRCodeColor | undefined,
  defaultValue: QRCodeColor | undefined,
): string | undefined {
  if (value === undefined || !isQRCodeColor(value) || colorsEqual(value, defaultValue)) {
    return undefined;
  }

  // The leading "#" is omitted to avoid encoding it as "%23".
  return value.slice(1).toLowerCase();
}

function colorsEqual(first: QRCodeColor, second: QRCodeColor | undefined): boolean {
  return second !== undefined && first.toLowerCase() === second.toLowerCase();
}

function isQRCodeVersion(value: unknown): value is QRCodeVersion {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 40;
}

function isQRCodeMask(value: unknown): value is QRCodeMask {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 7;
}

function compactObject<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);

  return entries.length > 0 ? (Object.fromEntries(entries) as T) : undefined;
}

type OptionalPlaygroundOptionsKey =
  | 'version'
  | 'mode'
  | 'errorCorrectionLevel'
  | 'mask'
  | 'moduleSize'
  | 'quietZone'
  | 'foreground'
  | 'background'
  | 'alt'
  | 'ariaLabel'
  | 'title';

function setOptionalProperty<K extends OptionalPlaygroundOptionsKey>(
  currentOptions: PlaygroundOptions,
  key: K,
  value: PlaygroundOptions[K],
): void {
  if (value === undefined) {
    delete (currentOptions as Partial<PlaygroundOptions>)[key];
  } else {
    currentOptions[key] = value;
  }
}

function clonePlaygroundOptions(currentOptions: PlaygroundOptions): PlaygroundOptions {
  return {
    ...currentOptions,
    modules: currentOptions.modules ? {...currentOptions.modules} : undefined,
    finder: currentOptions.finder
      ? {
          outer: currentOptions.finder.outer ? {...currentOptions.finder.outer} : undefined,
          center: currentOptions.finder.center ? {...currentOptions.finder.center} : undefined,
        }
      : undefined,
  };
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isQRCodeColor(value: unknown): value is QRCodeColor {
  return typeof value === 'string' && /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value);
}
