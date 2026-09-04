import type {
  QRCodeColor,
  QRCodeFinderShape,
  QRCodeMask,
  QRCodeModuleShape,
  QRCodeVersion,
} from '@qrcodesdk/core';

import {
  type PlaygroundConfig,
  type PlaygroundOutput,
  type PlaygroundPackage,
  defaultPlaygroundConfig,
  playgroundConfig,
} from './playground-config.ts';

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
  read(params: URLSearchParams, fallback: PlaygroundConfig, config: PlaygroundConfig): void;
  write(
    params: URLSearchParams,
    config: PlaygroundConfig,
    defaults: PlaygroundConfig | undefined,
  ): void;
}

const QUERY_FIELD_CODECS = [
  defineQueryField(
    'data',
    (config) => config.data,
    (config, data) => {
      config.data = data;
    },
    parseRequiredString,
    serializeString,
  ),
  defineQueryField(
    'package',
    (config) => config.packageName,
    (config, packageName) => {
      config.packageName = packageName;
    },
    (value, fallback) => parseStringUnion(value, PLAYGROUND_PACKAGES, fallback),
    serializeString,
  ),
  defineQueryField(
    'output',
    (config) => config.output,
    (config, output) => {
      config.output = output;
    },
    (value, fallback) => parseStringUnion(value, PLAYGROUND_OUTPUTS, fallback),
    serializeString,
  ),
  defineQueryField(
    'version',
    (config) => config.version,
    (config, version) => setOptionalProperty(config, 'version', version),
    (value, fallback) => parseOptionalNumber(value, isQRCodeVersion, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'mode',
    (config) => config.mode,
    (config, mode) => setOptionalProperty(config, 'mode', mode),
    (value, fallback) => parseOptionalStringUnion(value, MODES, fallback),
    serializeString,
  ),
  defineQueryField(
    'level',
    (config) => config.errorCorrectionLevel,
    (config, errorCorrectionLevel) =>
      setOptionalProperty(config, 'errorCorrectionLevel', errorCorrectionLevel),
    (value, fallback) => parseOptionalStringUnion(value, ERROR_CORRECTION_LEVELS, fallback),
    serializeString,
  ),
  defineQueryField(
    'mask',
    (config) => config.mask,
    (config, mask) => setOptionalProperty(config, 'mask', mask),
    (value, fallback) => parseOptionalNumber(value, isQRCodeMask, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'eci',
    (config) => config.eci ?? false,
    (config, eci) => {
      config.eci = eci;
    },
    parseBoolean,
    serializeBoolean,
  ),
  defineQueryField(
    'module-size',
    (config) => config.moduleSize,
    (config, moduleSize) => setOptionalProperty(config, 'moduleSize', moduleSize),
    (value, fallback) => parseOptionalNumber(value, isPositiveInteger, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'quiet-zone',
    (config) => config.quietZone,
    (config, quietZone) => setOptionalProperty(config, 'quietZone', quietZone),
    (value, fallback) => parseOptionalNumber(value, isNonNegativeInteger, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'background',
    (config) => config.background,
    (config, background) => setOptionalProperty(config, 'background', background),
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'foreground',
    (config) => config.foreground,
    (config, foreground) => setOptionalProperty(config, 'foreground', foreground),
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'modules-color',
    (config) => config.modules?.color,
    (config, color) => {
      config.modules = compactObject({...config.modules, color});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'modules-shape',
    (config) => config.modules?.shape,
    (config, shape) => {
      config.modules = compactObject({...config.modules, shape});
    },
    (value, fallback) => parseOptionalStringUnion(value, MODULE_SHAPES, fallback),
    serializeString,
  ),
  defineQueryField(
    'finder-outer-color',
    (config) => config.finder?.outer?.color,
    (config, color) => {
      config.finder = {...config.finder, outer: compactObject({...config.finder?.outer, color})};
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'finder-outer-shape',
    (config) => config.finder?.outer?.shape,
    (config, shape) => {
      config.finder = {...config.finder, outer: compactObject({...config.finder?.outer, shape})};
    },
    (value, fallback) => parseOptionalStringUnion(value, FINDER_SHAPES, fallback),
    serializeString,
  ),
  defineQueryField(
    'finder-center-color',
    (config) => config.finder?.center?.color,
    (config, color) => {
      config.finder = {...config.finder, center: compactObject({...config.finder?.center, color})};
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'finder-center-shape',
    (config) => config.finder?.center?.shape,
    (config, shape) => {
      config.finder = {...config.finder, center: compactObject({...config.finder?.center, shape})};
    },
    (value, fallback) => parseOptionalStringUnion(value, FINDER_SHAPES, fallback),
    serializeString,
  ),
  defineQueryField(
    'alt',
    (config) => config.alt,
    (config, alt) => setOptionalProperty(config, 'alt', alt),
    parseOptionalString,
    serializeString,
  ),
  defineQueryField(
    'aria-label',
    (config) => config.ariaLabel,
    (config, ariaLabel) => setOptionalProperty(config, 'ariaLabel', ariaLabel),
    parseOptionalString,
    serializeString,
  ),
  defineQueryField(
    'title',
    (config) => config.title,
    (config, title) => setOptionalProperty(config, 'title', title),
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
   * Remove values that equal `defaultQrConfig`.
   */
  omitDefaults?: boolean;
}

export interface WriteQrConfigToUrlOptions {
  omitDefaults?: boolean;
}

let activeCleanup: (() => void) | undefined;

/**
 * Starts two-way synchronization between `qrConfig` and the current URL.
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

  playgroundConfig.set(readQrConfigFromUrl());

  applyingUrlState = false;

  const unsubscribe = playgroundConfig.subscribe((config) => {
    if (applyingUrlState) {
      return;
    }

    clearTimeout(updateTimer);

    updateTimer = setTimeout(() => {
      writeQrConfigToUrl(config, {
        omitDefaults,
      });
    }, debounceMs);
  });

  const handlePopState = (): void => {
    clearTimeout(updateTimer);
    applyingUrlState = true;

    try {
      playgroundConfig.set(readQrConfigFromUrl());
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
 * Reads the current browser URL into a validated playground configuration.
 */
export function readQrConfigFromUrl(
  fallback: PlaygroundConfig = defaultPlaygroundConfig,
): PlaygroundConfig {
  if (typeof window === 'undefined') {
    return clonePlaygroundConfig(fallback);
  }

  return readQrConfigFromSearchParams(new URLSearchParams(window.location.search), fallback);
}

/**
 * Parses a URLSearchParams instance into a validated playground configuration.
 */
export function readQrConfigFromSearchParams(
  params: URLSearchParams,
  fallback: PlaygroundConfig = defaultPlaygroundConfig,
): PlaygroundConfig {
  const config = clonePlaygroundConfig(fallback);

  for (const codec of QUERY_FIELD_CODECS) {
    codec.read(params, fallback, config);
  }

  return config;
}

/**
 * Writes a playground configuration to the current browser URL.
 *
 * Query parameters not owned by the playground are preserved.
 */
export function writeQrConfigToUrl(
  config: PlaygroundConfig,
  options: WriteQrConfigToUrlOptions = {},
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const {omitDefaults = true} = options;

  const url = new URL(window.location.href);

  writeQrConfigToSearchParams(
    url.searchParams,
    config,
    omitDefaults ? defaultPlaygroundConfig : undefined,
  );

  if (url.href === window.location.href) {
    return;
  }

  window.history.replaceState(window.history.state, '', url);
}

/**
 * Writes the configuration into an existing URLSearchParams instance.
 *
 * Only playground-owned parameters are modified. Other parameters remain.
 */
export function writeQrConfigToSearchParams(
  params: URLSearchParams,
  config: PlaygroundConfig,
  defaults?: PlaygroundConfig,
): URLSearchParams {
  for (const codec of QUERY_FIELD_CODECS) {
    codec.write(params, config, defaults);
  }

  return params;
}

function defineQueryField<T>(
  key: string,
  getValue: (config: PlaygroundConfig) => T,
  setValue: (config: PlaygroundConfig, value: T) => void,
  parse: (value: string | null, fallback: T) => T,
  serialize: (value: T, defaultValue: T | undefined) => string | undefined,
): QueryFieldCodec {
  return {
    key,
    read(params, fallback, config) {
      setValue(config, parse(params.get(key), getValue(fallback)));
    },
    write(params, config, defaults) {
      const defaultValue = defaults === undefined ? undefined : getValue(defaults);
      const value = serialize(getValue(config), defaultValue);

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

type OptionalPlaygroundConfigKey =
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

function setOptionalProperty<K extends OptionalPlaygroundConfigKey>(
  config: PlaygroundConfig,
  key: K,
  value: PlaygroundConfig[K],
): void {
  if (value === undefined) {
    delete (config as Partial<PlaygroundConfig>)[key];
  } else {
    config[key] = value;
  }
}

function clonePlaygroundConfig(config: PlaygroundConfig): PlaygroundConfig {
  return {
    ...config,
    modules: config.modules ? {...config.modules} : undefined,
    finder: config.finder
      ? {
          outer: config.finder.outer ? {...config.finder.outer} : undefined,
          center: config.finder.center ? {...config.finder.center} : undefined,
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
