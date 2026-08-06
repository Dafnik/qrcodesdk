import {
  ɵECC_LEVELS,
  ɵMODES,
  ɵisQRCodeColorHex,
  ɵisQRCodeCornerDotType,
  ɵisQRCodeCornerSquareType,
  ɵisQRCodeDotType,
  ɵisValidQRCodeMargin,
  ɵisValidQRCodeSize,
} from '@qrcodesdk/core';
import type {QRCodeColorHex, QRCodeMask, QRCodeVersion} from '@qrcodesdk/core';

import {
  type PlaygroundConfig,
  type PlaygroundOutput,
  type PlaygroundPackage,
  defaultPlaygroundConfig,
  playgroundConfig,
} from './playground-config.ts';

const PLAYGROUND_PACKAGES = ['angular', 'react'] as const satisfies readonly PlaygroundPackage[];

const PLAYGROUND_OUTPUTS = [
  'svg',
  'image',
  'canvas',
] as const satisfies readonly PlaygroundOutput[];

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
    (value, fallback) => parseOptionalStringUnion(value, ɵMODES, fallback),
    serializeString,
  ),
  defineQueryField(
    'level',
    (config) => config.errorCorrectionLevel,
    (config, errorCorrectionLevel) =>
      setOptionalProperty(config, 'errorCorrectionLevel', errorCorrectionLevel),
    (value, fallback) => parseOptionalStringUnion(value, ɵECC_LEVELS, fallback),
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
    'size',
    (config) => config.size,
    (config, size) => setOptionalProperty(config, 'size', size),
    (value, fallback) => parseOptionalNumber(value, ɵisValidQRCodeSize, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'margin',
    (config) => config.margin,
    (config, margin) => setOptionalProperty(config, 'margin', margin),
    (value, fallback) => parseOptionalNumber(value, ɵisValidQRCodeMargin, fallback),
    serializeNumber,
  ),
  defineQueryField(
    'light',
    (config) => config.colors?.colorLight,
    (config, colorLight) => {
      config.colors = compactObject({...config.colors, colorLight});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'dark',
    (config) => config.colors?.colorDark,
    (config, colorDark) => {
      config.colors = compactObject({...config.colors, colorDark});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'dots-color',
    (config) => config.dotsOptions?.color,
    (config, color) => {
      config.dotsOptions = compactObject({...config.dotsOptions, color});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'dots-type',
    (config) => config.dotsOptions?.type,
    (config, type) => {
      config.dotsOptions = compactObject({...config.dotsOptions, type});
    },
    (value, fallback) => parseOptionalGuardedString(value, ɵisQRCodeDotType, fallback),
    serializeString,
  ),
  defineQueryField(
    'corner-square-color',
    (config) => config.cornersSquareOptions?.color,
    (config, color) => {
      config.cornersSquareOptions = compactObject({...config.cornersSquareOptions, color});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'corner-square-type',
    (config) => config.cornersSquareOptions?.type,
    (config, type) => {
      config.cornersSquareOptions = compactObject({...config.cornersSquareOptions, type});
    },
    (value, fallback) => parseOptionalGuardedString(value, ɵisQRCodeCornerSquareType, fallback),
    serializeString,
  ),
  defineQueryField(
    'corner-dot-color',
    (config) => config.cornersDotOptions?.color,
    (config, color) => {
      config.cornersDotOptions = compactObject({...config.cornersDotOptions, color});
    },
    parseOptionalColor,
    serializeColor,
  ),
  defineQueryField(
    'corner-dot-type',
    (config) => config.cornersDotOptions?.type,
    (config, type) => {
      config.cornersDotOptions = compactObject({...config.cornersDotOptions, type});
    },
    (value, fallback) => parseOptionalGuardedString(value, ɵisQRCodeCornerDotType, fallback),
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

function parseOptionalGuardedString<T extends string>(
  value: string | null,
  guard: (value: unknown) => value is T,
  fallback: T | undefined,
): T | undefined {
  if (value === null) {
    return fallback;
  }

  return guard(value) ? value : fallback;
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
  fallback: QRCodeColorHex | undefined,
): QRCodeColorHex | undefined {
  if (value === null || value.trim() === '') {
    return fallback;
  }

  const normalized = value.startsWith('#') ? value : `#${value}`;

  if (!ɵisQRCodeColorHex(normalized)) {
    return fallback;
  }

  return normalized.toLowerCase() as QRCodeColorHex;
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
  value: QRCodeColorHex | undefined,
  defaultValue: QRCodeColorHex | undefined,
): string | undefined {
  if (value === undefined || !ɵisQRCodeColorHex(value) || colorsEqual(value, defaultValue)) {
    return undefined;
  }

  // The leading "#" is omitted to avoid encoding it as "%23".
  return value.slice(1).toLowerCase();
}

function colorsEqual(first: QRCodeColorHex, second: QRCodeColorHex | undefined): boolean {
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
  | 'size'
  | 'margin'
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

    colors: config.colors ? {...config.colors} : undefined,

    dotsOptions: config.dotsOptions ? {...config.dotsOptions} : undefined,

    cornersSquareOptions: config.cornersSquareOptions
      ? {...config.cornersSquareOptions}
      : undefined,

    cornersDotOptions: config.cornersDotOptions ? {...config.cornersDotOptions} : undefined,
  };
}
