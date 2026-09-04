import type {
  QRCodeFinderShape,
  QRCodeMatrixOptions,
  QRCodeModuleShape,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

export type QRCodeStylingFixture = {
  readonly name: string;
  readonly data: string;
  readonly matrixOptions: QRCodeMatrixOptions;
  readonly styling: QRCodeVisualStyle;
};

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
const PALETTES = [
  {name: 'default', background: '#ffffff', modules: '#000000', outer: '#000000', center: '#000000'},
  {name: 'navy', background: '#ffffff', modules: '#102a43', outer: '#102a43', center: '#102a43'},
  {name: 'jewel', background: '#ffffff', modules: '#112233', outer: '#1f4d3a', center: '#4a234a'},
  {name: 'slate', background: '#fffaf0', modules: '#2d3748', outer: '#344e2e', center: '#512b58'},
  {name: 'mono', background: '#f8fafc', modules: '#111827', outer: '#111827', center: '#111827'},
  {name: 'mixed', background: '#fdfaf6', modules: '#17365d', outer: '#234e3f', center: '#4c285e'},
] as const;

const fixtures: QRCodeStylingFixture[] = [];
for (let index = 0; index < 60; index++) {
  const moduleShape = MODULE_SHAPES[index % MODULE_SHAPES.length]!;
  const outerShape = FINDER_SHAPES[Math.floor(index / 6) % FINDER_SHAPES.length]!;
  const centerShape = FINDER_SHAPES[Math.floor(index / 15) % FINDER_SHAPES.length]!;
  const palette = PALETTES[index % PALETTES.length]!;
  fixtures.push({
    name: `modules-${moduleShape}_outer-${outerShape}_center-${centerShape}_palette-${palette.name}`,
    data: 'The quick brown fox jumps over the lazy dog',
    matrixOptions: {version: 5, mode: 'octet', errorCorrectionLevel: 'H', mask: 3},
    styling: {
      moduleSize: 12,
      quietZone: 4,
      background: palette.background,
      modules: {shape: moduleShape, color: palette.modules},
      finder: {
        outer: {shape: outerShape, color: palette.outer},
        center: {shape: centerShape, color: palette.center},
      },
    },
  });
}

export const QR_CODE_STYLING_FIXTURES: readonly QRCodeStylingFixture[] = fixtures;

const SCANNER_SENSITIVE_FIXTURES = new Set([
  'modules-square_outer-extra-rounded_center-square_palette-default',
  'modules-circle_outer-extra-rounded_center-square_palette-navy',
  'modules-circle_outer-square_center-circle_palette-navy',
]);

export const QR_CODE_STYLING_ROUNDTRIP_FIXTURES: readonly QRCodeStylingFixture[] =
  QR_CODE_STYLING_FIXTURES.filter(({name}) => !SCANNER_SENSITIVE_FIXTURES.has(name));
