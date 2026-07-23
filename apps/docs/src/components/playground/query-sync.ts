import {
  ECC_LEVELS,
  MODES,
  isQRCodeColorHex,
  isQRCodeCornerDotType,
  isQRCodeCornerSquareType,
  isQRCodeDotType,
  isValidQRCodeMargin,
  isValidQRCodeSize,
} from '@qrcodesdk/core';
import type {QRCodeColorHex, QRCodeMask, QRCodeVersion} from '@qrcodesdk/core';

import {
  type PlaygroundConfig,
  type PlaygroundOutput,
  type PlaygroundPackage,
  defaultQrConfig,
  qrConfig,
} from './playground-config';

const PLAYGROUND_PACKAGES = ['angular', 'react'] as const satisfies readonly PlaygroundPackage[];

const PLAYGROUND_OUTPUTS = [
  'svg',
  'image',
  'canvas',
] as const satisfies readonly PlaygroundOutput[];

const QUERY_PARAM_KEYS = {
  value: 'value',
  packageName: 'package',
  output: 'output',

  version: 'version',
  mode: 'mode',
  errorCorrectionLevel: 'level',
  mask: 'mask',

  size: 'size',
  margin: 'margin',

  colorLight: 'light',
  colorDark: 'dark',

  dotsColor: 'dots-color',
  dotsType: 'dots-type',

  cornersSquareColor: 'corner-square-color',
  cornersSquareType: 'corner-square-type',

  cornersDotColor: 'corner-dot-color',
  cornersDotType: 'corner-dot-type',

  alt: 'alt',
  ariaLabel: 'aria-label',
  title: 'title',
} as const;

const MANAGED_QUERY_PARAM_KEYS = Object.values(QUERY_PARAM_KEYS);

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
  history?: 'replace' | 'push';
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

  qrConfig.set(readQrConfigFromUrl());

  applyingUrlState = false;

  const unsubscribe = qrConfig.subscribe((config) => {
    if (applyingUrlState) {
      return;
    }

    clearTimeout(updateTimer);

    updateTimer = setTimeout(() => {
      writeQrConfigToUrl(config, {
        history: 'replace',
        omitDefaults,
      });
    }, debounceMs);
  });

  const handlePopState = (): void => {
    clearTimeout(updateTimer);
    applyingUrlState = true;

    try {
      qrConfig.set(readQrConfigFromUrl());
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
 * Stops URL synchronization when it has previously been started.
 */
export function stopQrQuerySync(): void {
  activeCleanup?.();
}

/**
 * Reads the current browser URL into a validated playground configuration.
 */
export function readQrConfigFromUrl(
  fallback: PlaygroundConfig = defaultQrConfig,
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
  fallback: PlaygroundConfig = defaultQrConfig,
): PlaygroundConfig {
  const config: PlaygroundConfig = {
    value: readRequiredString(params, QUERY_PARAM_KEYS.value, fallback.value),

    packageName: parseStringUnion(
      params.get(QUERY_PARAM_KEYS.packageName),
      PLAYGROUND_PACKAGES,
      fallback.packageName,
    ),

    output: parseStringUnion(
      params.get(QUERY_PARAM_KEYS.output),
      PLAYGROUND_OUTPUTS,
      fallback.output,
    ),
  };

  assignDefined(
    config,
    'version',
    parseOptionalNumber(params.get(QUERY_PARAM_KEYS.version), isQRCodeVersion, fallback.version),
  );

  assignDefined(
    config,
    'mode',
    parseOptionalStringUnion(params.get(QUERY_PARAM_KEYS.mode), MODES, fallback.mode),
  );

  assignDefined(
    config,
    'errorCorrectionLevel',
    parseOptionalStringUnion(
      params.get(QUERY_PARAM_KEYS.errorCorrectionLevel),
      ECC_LEVELS,
      fallback.errorCorrectionLevel,
    ),
  );

  assignDefined(
    config,
    'mask',
    parseOptionalNumber(params.get(QUERY_PARAM_KEYS.mask), isQRCodeMask, fallback.mask),
  );

  assignDefined(
    config,
    'size',
    parseOptionalNumber(params.get(QUERY_PARAM_KEYS.size), isValidQRCodeSize, fallback.size),
  );

  assignDefined(
    config,
    'margin',
    parseOptionalNumber(params.get(QUERY_PARAM_KEYS.margin), isValidQRCodeMargin, fallback.margin),
  );

  const colors = compactObject({
    colorLight: parseOptionalColor(
      params.get(QUERY_PARAM_KEYS.colorLight),
      fallback.colors?.colorLight,
    ),

    colorDark: parseOptionalColor(
      params.get(QUERY_PARAM_KEYS.colorDark),
      fallback.colors?.colorDark,
    ),
  });

  if (colors) {
    config.colors = colors;
  }

  const dotsOptions = compactObject({
    color: parseOptionalColor(params.get(QUERY_PARAM_KEYS.dotsColor), fallback.dotsOptions?.color),

    type: parseOptionalGuardedString(
      params.get(QUERY_PARAM_KEYS.dotsType),
      isQRCodeDotType,
      fallback.dotsOptions?.type,
    ),
  });

  if (dotsOptions) {
    config.dotsOptions = dotsOptions;
  }

  const cornersSquareOptions = compactObject({
    color: parseOptionalColor(
      params.get(QUERY_PARAM_KEYS.cornersSquareColor),
      fallback.cornersSquareOptions?.color,
    ),

    type: parseOptionalGuardedString(
      params.get(QUERY_PARAM_KEYS.cornersSquareType),
      isQRCodeCornerSquareType,
      fallback.cornersSquareOptions?.type,
    ),
  });

  if (cornersSquareOptions) {
    config.cornersSquareOptions = cornersSquareOptions;
  }

  const cornersDotOptions = compactObject({
    color: parseOptionalColor(
      params.get(QUERY_PARAM_KEYS.cornersDotColor),
      fallback.cornersDotOptions?.color,
    ),

    type: parseOptionalGuardedString(
      params.get(QUERY_PARAM_KEYS.cornersDotType),
      isQRCodeCornerDotType,
      fallback.cornersDotOptions?.type,
    ),
  });

  if (cornersDotOptions) {
    config.cornersDotOptions = cornersDotOptions;
  }

  assignDefined(config, 'alt', readOptionalString(params, QUERY_PARAM_KEYS.alt, fallback.alt));

  assignDefined(
    config,
    'ariaLabel',
    readOptionalString(params, QUERY_PARAM_KEYS.ariaLabel, fallback.ariaLabel),
  );

  assignDefined(
    config,
    'title',
    readOptionalString(params, QUERY_PARAM_KEYS.title, fallback.title),
  );

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

  const {history = 'replace', omitDefaults = true} = options;

  const url = new URL(window.location.href);

  writeQrConfigToSearchParams(url.searchParams, config, omitDefaults ? defaultQrConfig : undefined);

  if (url.href === window.location.href) {
    return;
  }

  if (history === 'push') {
    window.history.pushState(window.history.state, '', url);
  } else {
    window.history.replaceState(window.history.state, '', url);
  }
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
  setStringParam(params, QUERY_PARAM_KEYS.value, config.value, defaults?.value);

  setStringParam(params, QUERY_PARAM_KEYS.packageName, config.packageName, defaults?.packageName);

  setStringParam(params, QUERY_PARAM_KEYS.output, config.output, defaults?.output);

  setNumberParam(params, QUERY_PARAM_KEYS.version, config.version, defaults?.version);

  setStringParam(params, QUERY_PARAM_KEYS.mode, config.mode, defaults?.mode);

  setStringParam(
    params,
    QUERY_PARAM_KEYS.errorCorrectionLevel,
    config.errorCorrectionLevel,
    defaults?.errorCorrectionLevel,
  );

  setNumberParam(params, QUERY_PARAM_KEYS.mask, config.mask, defaults?.mask);

  setNumberParam(params, QUERY_PARAM_KEYS.size, config.size, defaults?.size);

  setNumberParam(params, QUERY_PARAM_KEYS.margin, config.margin, defaults?.margin);

  setColorParam(
    params,
    QUERY_PARAM_KEYS.colorLight,
    config.colors?.colorLight,
    defaults?.colors?.colorLight,
  );

  setColorParam(
    params,
    QUERY_PARAM_KEYS.colorDark,
    config.colors?.colorDark,
    defaults?.colors?.colorDark,
  );

  setColorParam(
    params,
    QUERY_PARAM_KEYS.dotsColor,
    config.dotsOptions?.color,
    defaults?.dotsOptions?.color,
  );

  setStringParam(
    params,
    QUERY_PARAM_KEYS.dotsType,
    config.dotsOptions?.type,
    defaults?.dotsOptions?.type,
  );

  setColorParam(
    params,
    QUERY_PARAM_KEYS.cornersSquareColor,
    config.cornersSquareOptions?.color,
    defaults?.cornersSquareOptions?.color,
  );

  setStringParam(
    params,
    QUERY_PARAM_KEYS.cornersSquareType,
    config.cornersSquareOptions?.type,
    defaults?.cornersSquareOptions?.type,
  );

  setColorParam(
    params,
    QUERY_PARAM_KEYS.cornersDotColor,
    config.cornersDotOptions?.color,
    defaults?.cornersDotOptions?.color,
  );

  setStringParam(
    params,
    QUERY_PARAM_KEYS.cornersDotType,
    config.cornersDotOptions?.type,
    defaults?.cornersDotOptions?.type,
  );

  setStringParam(params, QUERY_PARAM_KEYS.alt, config.alt, defaults?.alt);

  setStringParam(params, QUERY_PARAM_KEYS.ariaLabel, config.ariaLabel, defaults?.ariaLabel);

  setStringParam(params, QUERY_PARAM_KEYS.title, config.title, defaults?.title);

  return params;
}

/**
 * Pushes the current store configuration as a meaningful browser-history entry.
 *
 * Useful for presets, reset actions, or an explicit "Apply" action.
 */
export function pushCurrentQrConfigToUrl(omitDefaults = true): void {
  writeQrConfigToUrl(qrConfig.get(), {
    history: 'push',
    omitDefaults,
  });
}

/**
 * Removes every query parameter managed by the playground.
 *
 * Unrelated query parameters are preserved.
 */
export function clearQrConfigQueryParams(history: 'replace' | 'push' = 'replace'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);

  for (const key of MANAGED_QUERY_PARAM_KEYS) {
    url.searchParams.delete(key);
  }

  if (history === 'push') {
    window.history.pushState(window.history.state, '', url);
  } else {
    window.history.replaceState(window.history.state, '', url);
  }
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

  if (!isQRCodeColorHex(normalized)) {
    return fallback;
  }

  return normalized.toLowerCase() as QRCodeColorHex;
}

function readRequiredString(params: URLSearchParams, key: string, fallback: string): string {
  if (!params.has(key)) {
    return fallback;
  }

  return params.get(key) ?? fallback;
}

function readOptionalString(
  params: URLSearchParams,
  key: string,
  fallback: string | undefined,
): string | undefined {
  if (!params.has(key)) {
    return fallback;
  }

  const value = params.get(key);

  return value === null || value === '' ? undefined : value;
}

function setStringParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
  defaultValue: string | undefined,
): void {
  if (value === undefined || value === '' || value === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, value);
}

function setNumberParam(
  params: URLSearchParams,
  key: string,
  value: number | undefined,
  defaultValue: number | undefined,
): void {
  if (value === undefined || value === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}

function setColorParam(
  params: URLSearchParams,
  key: string,
  value: QRCodeColorHex | undefined,
  defaultValue: QRCodeColorHex | undefined,
): void {
  if (value === undefined || !isQRCodeColorHex(value) || colorsEqual(value, defaultValue)) {
    params.delete(key);
    return;
  }

  // The leading "#" is omitted to avoid encoding it as "%23".
  params.set(key, value.slice(1).toLowerCase());
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

function assignDefined<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
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
