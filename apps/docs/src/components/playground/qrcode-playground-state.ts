import {
  isQRCodeColorHex,
  isQRCodeCornerDotType,
  isQRCodeCornerSquareType,
  isQRCodeDotType,
  isValidQRCodeMargin,
  isValidQRCodeSize,
  qrcode,
} from '@qrcodesdk/core';
import type {
  QRCodeColorHex,
  QRCodeCornerDotType,
  QRCodeCornerSquareType,
  QRCodeDotType,
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMode,
  QRCodeVersion,
} from '@qrcodesdk/core';

import type {
  QRCodePlaygroundConfig,
  QRCodePlaygroundDraft,
  QRCodePlaygroundOutput,
  QRCodePlaygroundPackage,
  QRCodePlaygroundSnapshot,
  QRCodePlaygroundValidation,
} from './qrcode-playground-types';

const DEFAULT_DRAFT: QRCodePlaygroundDraft = {
  packageName: 'react',
  output: 'svg',
  data: 'https://qrcodesdk.dev',
  mode: 'auto',
  version: 'auto',
  errorCorrectionLevel: 'auto',
  mask: 'auto',
  size: 8,
  margin: 4,
  colorDark: '#111827',
  colorLight: '#ffffff',
  dotsType: 'square',
  cornersSquareType: 'square',
  cornersDotType: 'square',
  title: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
  alt: 'QR code for qrcodesdk.dev',
};

export const QR_CODE_PLAYGROUND_DEFAULT_DRAFT = DEFAULT_DRAFT;

export function readPlaygroundDraftFromUrl(): QRCodePlaygroundDraft {
  if (typeof window === 'undefined') return DEFAULT_DRAFT;

  return parsePlaygroundDraft(new URLSearchParams(window.location.search));
}

export function parsePlaygroundDraft(params: URLSearchParams): QRCodePlaygroundDraft {
  return {
    packageName: parsePackage(params.get('pkg')),
    output: parseOutput(params.get('output')),
    data: params.get('data') ?? DEFAULT_DRAFT.data,
    mode: parseMode(params.get('mode')),
    version: parseVersion(params.get('version')),
    errorCorrectionLevel: parseErrorCorrectionLevel(params.get('ecl')),
    mask: parseMask(params.get('mask')),
    size: parseInteger(params.get('size'), DEFAULT_DRAFT.size),
    margin: parseInteger(params.get('margin'), DEFAULT_DRAFT.margin),
    colorDark: parseColorParam(params.get('dark'), DEFAULT_DRAFT.colorDark),
    colorLight: parseColorParam(params.get('light'), DEFAULT_DRAFT.colorLight),
    dotsType: parseDotsType(params.get('dots-type')),
    dotsColor: parseOptionalColorParam(params.get('dots-color')),
    cornersSquareType: parseCornersSquareType(params.get('corners-square-type')),
    cornersSquareColor: parseOptionalColorParam(params.get('corners-square-color')),
    cornersDotType: parseCornersDotType(params.get('corners-dot-type')),
    cornersDotColor: parseOptionalColorParam(params.get('corners-dot-color')),
    title: params.get('title') ?? DEFAULT_DRAFT.title,
    ariaLabel: params.get('aria') ?? DEFAULT_DRAFT.ariaLabel,
    alt: params.get('alt') ?? DEFAULT_DRAFT.alt,
  };
}

export function createPlaygroundSnapshot(draft: QRCodePlaygroundDraft): QRCodePlaygroundSnapshot {
  const validation = validatePlaygroundDraft(draft);
  const config = validation.valid ? createPlaygroundConfig(draft) : undefined;

  return {
    draft,
    config,
    validation,
  };
}

export function validatePlaygroundDraft(draft: QRCodePlaygroundDraft): QRCodePlaygroundValidation {
  const fieldErrors: QRCodePlaygroundValidation['fieldErrors'] = {};

  if (!isValidQRCodeSize(draft.size)) {
    fieldErrors.size = 'Size must be a positive integer.';
  }

  if (!isValidQRCodeMargin(draft.margin)) {
    fieldErrors.margin = 'Margin must be zero or a positive integer.';
  }

  if (!isQRCodeColorHex(draft.colorDark)) {
    fieldErrors.colorDark = 'Use a 6-digit hex color.';
  }

  if (!isQRCodeColorHex(draft.colorLight)) {
    fieldErrors.colorLight = 'Use a 6-digit hex color.';
  }

  validateOptionalColor('dotsColor', draft.dotsColor, fieldErrors);
  validateOptionalColor('cornersSquareColor', draft.cornersSquareColor, fieldErrors);
  validateOptionalColor('cornersDotColor', draft.cornersDotColor, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      error: 'Fix the highlighted render options before previewing this QR code.',
      fieldErrors,
    };
  }

  try {
    qrcode(draft.data)
      .version(valueOrUndefined(draft.version))
      .mode(valueOrUndefined(draft.mode))
      .errorCorrection(valueOrUndefined(draft.errorCorrectionLevel))
      .mask(valueOrUndefined(draft.mask))
      .matrix();
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'This QR code configuration is invalid.',
      fieldErrors,
    };
  }

  return {
    valid: true,
    fieldErrors,
  };
}

export function createPlaygroundConfig(draft: QRCodePlaygroundDraft): QRCodePlaygroundConfig {
  const options: QRCodePlaygroundConfig['options'] = {
    size: draft.size,
    margin: draft.margin,
    colors: {
      colorDark: draft.colorDark as QRCodeColorHex,
      colorLight: draft.colorLight as QRCodeColorHex,
    },
  };

  if (draft.dotsType !== 'square' || draft.dotsColor !== undefined) {
    options.dotsOptions = {
      type: draft.dotsType,
      ...(draft.dotsColor === undefined ? {} : {color: draft.dotsColor as QRCodeColorHex}),
    };
  }
  if (draft.cornersSquareType !== 'square' || draft.cornersSquareColor !== undefined) {
    options.cornersSquareOptions = {
      type: draft.cornersSquareType,
      ...(draft.cornersSquareColor === undefined
        ? {}
        : {color: draft.cornersSquareColor as QRCodeColorHex}),
    };
  }
  if (draft.cornersDotType !== 'square' || draft.cornersDotColor !== undefined) {
    options.cornersDotOptions = {
      type: draft.cornersDotType,
      ...(draft.cornersDotColor === undefined
        ? {}
        : {color: draft.cornersDotColor as QRCodeColorHex}),
    };
  }

  const version = valueOrUndefined(draft.version);
  const mode = valueOrUndefined(draft.mode);
  const errorCorrectionLevel = valueOrUndefined(draft.errorCorrectionLevel);
  const mask = valueOrUndefined(draft.mask);

  if (version !== undefined) options.version = version;
  if (mode !== undefined) options.mode = mode;
  if (errorCorrectionLevel !== undefined) options.errorCorrectionLevel = errorCorrectionLevel;
  if (mask !== undefined) options.mask = mask;

  if (draft.output !== 'canvas') {
    if (draft.alt) options.alt = draft.alt;
    if (draft.ariaLabel) options.ariaLabel = draft.ariaLabel;
    if (draft.title) options.title = draft.title;
  }

  return {
    packageName: draft.packageName,
    output: draft.output,
    data: draft.data,
    options,
  };
}

export function writePlaygroundDraftToUrl(draft: QRCodePlaygroundDraft): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams();

  setChangedParam(params, 'pkg', draft.packageName, DEFAULT_DRAFT.packageName);
  setChangedParam(params, 'output', draft.output, DEFAULT_DRAFT.output);
  setChangedParam(params, 'data', draft.data, DEFAULT_DRAFT.data);
  setChangedParam(params, 'mode', String(draft.mode), String(DEFAULT_DRAFT.mode));
  setChangedParam(params, 'version', String(draft.version), String(DEFAULT_DRAFT.version));
  setChangedParam(
    params,
    'ecl',
    String(draft.errorCorrectionLevel),
    String(DEFAULT_DRAFT.errorCorrectionLevel),
  );
  setChangedParam(params, 'mask', String(draft.mask), String(DEFAULT_DRAFT.mask));
  setChangedParam(params, 'size', String(draft.size), String(DEFAULT_DRAFT.size));
  setChangedParam(params, 'margin', String(draft.margin), String(DEFAULT_DRAFT.margin));
  setChangedParam(params, 'dark', stripHash(draft.colorDark), stripHash(DEFAULT_DRAFT.colorDark));
  setChangedParam(
    params,
    'light',
    stripHash(draft.colorLight),
    stripHash(DEFAULT_DRAFT.colorLight),
  );
  setChangedParam(params, 'dots-type', draft.dotsType, DEFAULT_DRAFT.dotsType);
  setOptionalColorParam(params, 'dots-color', draft.dotsColor);
  setChangedParam(
    params,
    'corners-square-type',
    draft.cornersSquareType,
    DEFAULT_DRAFT.cornersSquareType,
  );
  setOptionalColorParam(params, 'corners-square-color', draft.cornersSquareColor);
  setChangedParam(params, 'corners-dot-type', draft.cornersDotType, DEFAULT_DRAFT.cornersDotType);
  setOptionalColorParam(params, 'corners-dot-color', draft.cornersDotColor);
  setChangedParam(params, 'title', draft.title, DEFAULT_DRAFT.title);
  setChangedParam(params, 'aria', draft.ariaLabel, DEFAULT_DRAFT.ariaLabel);
  setChangedParam(params, 'alt', draft.alt, DEFAULT_DRAFT.alt);

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

export function normalizeHexColorInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '#';

  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function parsePackage(value: string | null): QRCodePlaygroundPackage {
  return value === 'angular' ? 'angular' : 'react';
}

function parseOutput(value: string | null): QRCodePlaygroundOutput {
  if (value === 'image' || value === 'canvas') return value;
  return 'svg';
}

function parseMode(value: string | null): QRCodeMode | 'auto' {
  if (value === 'numeric' || value === 'alphanumeric' || value === 'octet') return value;
  return 'auto';
}

function parseErrorCorrectionLevel(value: string | null): QRCodeErrorCorrectionLevel | 'auto' {
  if (value === 'L' || value === 'M' || value === 'Q' || value === 'H') return value;
  return 'auto';
}

function parseVersion(value: string | null): QRCodeVersion | 'auto' {
  const version = Number(value);
  if (Number.isInteger(version) && version >= 1 && version <= 40) return version as QRCodeVersion;
  return 'auto';
}

function parseMask(value: string | null): QRCodeMask | 'auto' {
  if (value === null || value === 'auto') return 'auto';

  const mask = Number(value);
  if (Number.isInteger(mask) && mask >= 0 && mask <= 7) return mask as QRCodeMask;
  return 'auto';
}

function parseInteger(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback;

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function parseColorParam(value: string | null, fallback: string): string {
  if (!value) return fallback;
  return normalizeHexColorInput(value);
}

function parseOptionalColorParam(value: string | null): string | undefined {
  return value ? normalizeHexColorInput(value) : undefined;
}

function parseDotsType(value: string | null): QRCodeDotType {
  return isQRCodeDotType(value) ? value : DEFAULT_DRAFT.dotsType;
}

function parseCornersSquareType(value: string | null): QRCodeCornerSquareType {
  return isQRCodeCornerSquareType(value) ? value : DEFAULT_DRAFT.cornersSquareType;
}

function parseCornersDotType(value: string | null): QRCodeCornerDotType {
  return isQRCodeCornerDotType(value) ? value : DEFAULT_DRAFT.cornersDotType;
}

function stripHash(value: string): string {
  return value.startsWith('#') ? value.slice(1) : value;
}

function setChangedParam(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue: string,
): void {
  if (value !== defaultValue) params.set(key, value);
}

function setOptionalColorParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  if (value !== undefined) params.set(key, stripHash(value));
}

function validateOptionalColor(
  field: 'dotsColor' | 'cornersSquareColor' | 'cornersDotColor',
  value: string | undefined,
  fieldErrors: QRCodePlaygroundValidation['fieldErrors'],
): void {
  if (value !== undefined && !isQRCodeColorHex(value)) {
    fieldErrors[field] = 'Use a 6-digit hex color.';
  }
}

function valueOrUndefined<T>(value: T | 'auto'): T | undefined {
  return value === 'auto' ? undefined : value;
}
