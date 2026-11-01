import type {
  QRCodeColor,
  QRCodeMatrixOptions,
  QRCodeShape,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';

export type QRCodeFixtureModuleShape =
  'square' | 'circle' | 'rounded' | 'extra-rounded' | 'diagonal' | 'diagonal-rounded';
export type QRCodeFixtureFinderShape = 'square' | 'rounded' | 'extra-rounded' | 'circle';

/** A serializable description of a fixture style, for adapters that need shape names. */
export type QRCodeStylingFixtureDesign = {
  readonly moduleSize: number;
  readonly quietZone: number;
  readonly background: QRCodeColor;
  readonly foreground: QRCodeColor;
  readonly modules: QRCodeFixtureModuleShape;
  readonly finder: {
    readonly ring: QRCodeFixtureFinderShape;
    readonly center: QRCodeFixtureFinderShape;
    readonly color: QRCodeColor;
  };
};

export type QRCodeStylingFixture = {
  readonly name: string;
  readonly payload: string;
  readonly matrixOptions: QRCodeMatrixOptions;
  readonly design: QRCodeStylingFixtureDesign;
  readonly styling: QRCodeVisualStyle;
};

const MODULE_SHAPES = [
  'square',
  'circle',
  'rounded',
  'extra-rounded',
  'diagonal',
  'diagonal-rounded',
] as const satisfies readonly QRCodeFixtureModuleShape[];
const FINDER_SHAPES = [
  'square',
  'rounded',
  'extra-rounded',
  'circle',
] as const satisfies readonly QRCodeFixtureFinderShape[];
const PALETTES = [
  {name: 'default', background: '#ffffff', foreground: '#000000', finder: '#000000'},
  {name: 'navy', background: '#ffffff', foreground: '#102a43', finder: '#102a43'},
  {name: 'jewel', background: '#ffffff', foreground: '#112233', finder: '#1f4d3a'},
  {name: 'slate', background: '#fffaf0', foreground: '#2d3748', finder: '#344e2e'},
  {name: 'mono', background: '#f8fafc', foreground: '#111827', finder: '#111827'},
  {name: 'mixed', background: '#fdfaf6', foreground: '#17365d', finder: '#4c285e'},
] as const;

/** Creates a fixture shape by name. `square` has no shape because squares are the default. */
export function createFixtureShape(
  name: QRCodeFixtureModuleShape | QRCodeFixtureFinderShape,
): QRCodeShape | undefined {
  switch (name) {
    case 'circle':
      return circle();
    case 'rounded':
      return rounded();
    case 'extra-rounded':
      return rounded({radius: 1});
    case 'diagonal':
      return diagonal();
    case 'diagonal-rounded':
      return diagonal({radius: 1});
    default:
      return undefined;
  }
}

export function createFixtureStyle(design: QRCodeStylingFixtureDesign): QRCodeVisualStyle {
  return {
    moduleSize: design.moduleSize,
    quietZone: design.quietZone,
    background: design.background,
    foreground: design.foreground,
    modules: createFixtureShape(design.modules),
    finder: finder({
      ring: createFixtureShape(design.finder.ring),
      center: createFixtureShape(design.finder.center),
      color: design.finder.color,
    }),
  };
}

const fixtures: QRCodeStylingFixture[] = [];
for (let index = 0; index < 60; index++) {
  const moduleShape = MODULE_SHAPES[index % MODULE_SHAPES.length]!;
  const ringShape = FINDER_SHAPES[Math.floor(index / 6) % FINDER_SHAPES.length]!;
  const centerShape = FINDER_SHAPES[Math.floor(index / 15) % FINDER_SHAPES.length]!;
  const palette =
    PALETTES[
      (index + Math.floor(index / MODULE_SHAPES.length) + Math.floor(index / 15)) % PALETTES.length
    ]!;
  const design: QRCodeStylingFixtureDesign = {
    moduleSize: 12,
    quietZone: 4,
    background: palette.background,
    foreground: palette.foreground,
    modules: moduleShape,
    finder: {ring: ringShape, center: centerShape, color: palette.finder},
  };
  fixtures.push({
    name: `modules-${moduleShape}_ring-${ringShape}_center-${centerShape}_palette-${palette.name}`,
    payload: 'The quick brown fox jumps over the lazy dog',
    matrixOptions: {version: 5, mode: 'octet', errorCorrectionLevel: 'H', mask: 3},
    design,
    styling: createFixtureStyle(design),
  });
}

export const QR_CODE_STYLING_FIXTURES: readonly QRCodeStylingFixture[] = fixtures;

// jsQR misses circle finder centers between dot modules in these palettes.
const SCANNER_SENSITIVE_FIXTURES = new Set([
  'modules-circle_ring-square_center-circle_palette-default',
  'modules-circle_ring-rounded_center-circle_palette-navy',
]);

export const QR_CODE_STYLING_ROUNDTRIP_FIXTURES: readonly QRCodeStylingFixture[] =
  QR_CODE_STYLING_FIXTURES.filter(({name}) => !SCANNER_SENSITIVE_FIXTURES.has(name));
