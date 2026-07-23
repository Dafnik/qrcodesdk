import {describe, expect, test} from 'vitest';

import {
  type QRCodeColorHex,
  type QRCodeCornerDotType,
  type QRCodeCornerSquareType,
  type QRCodeDotType,
  isQRCodeColorHex,
  parseQRCodeStylingOptions,
} from '@qrcodesdk/core';

import {QR_CODE_STYLING_FIXTURES} from '../src';

const DOT_TYPES = [
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'square',
  'extra-rounded',
] as const satisfies readonly QRCodeDotType[];

const CORNER_SQUARE_TYPES = [
  'dot',
  'square',
  'extra-rounded',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
] as const satisfies readonly QRCodeCornerSquareType[];

const CORNER_DOT_TYPES = [
  'dot',
  'square',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'extra-rounded',
] as const satisfies readonly QRCodeCornerDotType[];

const PALETTE_NAMES = [
  'default',
  'global-navy',
  'feature-jewel',
  'slate-on-ivory',
  'explicit-monochrome',
  'deep-mixed',
] as const;

describe('QR_CODE_STYLING_FIXTURES', () => {
  test('provides 60 unique static styling cases', () => {
    expect(QR_CODE_STYLING_FIXTURES).toHaveLength(60);
    expect(new Set(QR_CODE_STYLING_FIXTURES.map(({name}) => name)).size).toBe(60);
    expect(new Set(QR_CODE_STYLING_FIXTURES.map(({styling}) => JSON.stringify(styling))).size).toBe(
      60,
    );
  });

  test('covers every supported shape type and palette', () => {
    for (const type of DOT_TYPES) {
      expect(
        QR_CODE_STYLING_FIXTURES.filter(({styling}) => styling.dotsOptions?.type === type),
      ).toHaveLength(10);
    }

    for (const type of CORNER_SQUARE_TYPES) {
      expect(
        QR_CODE_STYLING_FIXTURES.some(({styling}) => styling.cornersSquareOptions?.type === type),
      ).toBe(true);
    }

    for (const type of CORNER_DOT_TYPES) {
      expect(
        QR_CODE_STYLING_FIXTURES.some(({styling}) => styling.cornersDotOptions?.type === type),
      ).toBe(true);
    }

    for (const palette of PALETTE_NAMES) {
      expect(QR_CODE_STYLING_FIXTURES.some(({name}) => name.endsWith(`palette-${palette}`))).toBe(
        true,
      );
    }
  });

  test('uses fixed rendering and matrix options with valid high-contrast colors', () => {
    for (const fixture of QR_CODE_STYLING_FIXTURES) {
      expect(fixture.data).toBe('The quick brown fox jumps over the lazy dog');
      expect(fixture.matrixOptions).toEqual({
        version: 5,
        mode: 'octet',
        errorCorrectionLevel: 'H',
        mask: 0,
      });

      const styling = parseQRCodeStylingOptions(fixture.styling);
      expect(styling.size).toBe(12);
      expect(styling.margin).toBe(4);

      const foregroundColors = [
        styling.colors.colorDark,
        styling.dotsOptions.color,
        styling.cornersSquareOptions.color,
        styling.cornersDotOptions.color,
      ];
      expect(isQRCodeColorHex(styling.colors.colorLight)).toBe(true);
      for (const color of foregroundColors) {
        expect(isQRCodeColorHex(color)).toBe(true);
        expect(contrastRatio(color, styling.colors.colorLight)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

function contrastRatio(foreground: QRCodeColorHex, background: QRCodeColorHex): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: QRCodeColorHex): number {
  const channels = [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
