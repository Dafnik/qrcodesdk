import {
  GRADIENT_IMAGE,
  LOGO_IMAGE,
  type QRCodeFixtureImage,
  type QRCodeMicroTestFixture,
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  TALL_IMAGE,
  TRANSLUCENT_IMAGE,
  WIDE_IMAGE,
  fixtureMatrixOptions,
  fixtureMicroMatrixOptions,
} from '@repo/core-testing';

import type {
  QRCodeCenterImageLayout,
  QRCodeMatrixOptions,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

import type {KnownDecodeIssues} from '../rendering/decode';

export type FixtureCategoryId =
  | 'fixtures'
  | 'micro'
  | 'styling'
  | 'style-variants'
  | 'micro-style-variants'
  | 'center-images'
  | 'fixture-images';

export type CategoryId = FixtureCategoryId | 'all-combinations';

/** One QR code to render, normalized from the different fixture shapes of `@repo/core-testing`. */
export type DevFixture = {
  readonly id: string;
  readonly category: CategoryId;
  readonly name: string;
  readonly payload: string;
  readonly matrix: QRCodeMatrixOptions;
  readonly style?: QRCodeVisualStyle;
  readonly centerImage?: {
    readonly image: QRCodeFixtureImage;
    readonly layout?: QRCodeCenterImageLayout;
  };
  /** Replaces the description of `matrix`, whose symbol hides its version and mask. */
  readonly matrixDescription?: string;
  /** Decoders known to fail on this fixture, so their failed decodes aren't regressions. */
  readonly knownDecodeIssues?: KnownDecodeIssues;
};

export type FixtureCategory = {
  readonly id: FixtureCategoryId;
  readonly label: string;
  readonly source: string;
  readonly fixtures: readonly DevFixture[];
};

/** The style the roundtrip tests use for fixtures without their own style. */
export const PLAIN_STYLE: QRCodeVisualStyle = {moduleSize: 4, quietZone: 4};

/** ZXing drops symbols without content. The matrix tests compare the empty payload instead. */
const EMPTY_PAYLOAD_DECODE_ISSUES: KnownDecodeIssues = {
  zxing: 'ZXing ignores QR codes without content.',
};

export const FIXTURE_IMAGES: readonly QRCodeFixtureImage[] = [
  LOGO_IMAGE,
  WIDE_IMAGE,
  TALL_IMAGE,
  GRADIENT_IMAGE,
  TRANSLUCENT_IMAGE,
];

export const FIXTURE_CATEGORIES: readonly FixtureCategory[] = [
  {
    id: 'fixtures',
    label: 'Fixtures',
    source: 'QR_CODE_TEST_FIXTURES',
    fixtures: QR_CODE_TEST_FIXTURES.map((fixture) => ({
      id: `fixtures/${fixture.name}`,
      category: 'fixtures',
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureMatrixOptions(fixture),
      style: PLAIN_STYLE,
      knownDecodeIssues: fixture.payload === '' ? EMPTY_PAYLOAD_DECODE_ISSUES : undefined,
    })),
  },
  {
    id: 'micro',
    label: 'Micro QR fixtures',
    source: 'QR_CODE_MICRO_TEST_FIXTURES',
    fixtures: QR_CODE_MICRO_TEST_FIXTURES.map((fixture) => ({
      id: `micro/${fixture.name}`,
      category: 'micro',
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureMicroMatrixOptions(fixture),
      matrixDescription: describeMicroSymbol(fixture),
      // Micro QR codes take the default quiet zone of 2 modules.
      style: {moduleSize: 4},
    })),
  },
  {
    id: 'styling',
    label: 'Styling fixtures',
    source: 'QR_CODE_STYLING_FIXTURES',
    fixtures: QR_CODE_STYLING_FIXTURES.map((fixture) => ({
      id: `styling/${fixture.name}`,
      category: 'styling',
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.styling,
    })),
  },
  {
    id: 'style-variants',
    label: 'Style variant fixtures',
    source: 'QR_CODE_STYLE_VARIANT_FIXTURES',
    fixtures: QR_CODE_STYLE_VARIANT_FIXTURES.map((fixture) => ({
      id: `style-variants/${fixture.name}`,
      category: 'style-variants',
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.styling,
    })),
  },
  {
    id: 'micro-style-variants',
    label: 'Micro QR style variant fixtures',
    source: 'QR_CODE_MICRO_STYLE_VARIANT_FIXTURES',
    fixtures: QR_CODE_MICRO_STYLE_VARIANT_FIXTURES.map((fixture) => ({
      id: `micro-style-variants/${fixture.name}`,
      category: 'micro-style-variants',
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      matrixDescription: describeMicroSymbol(fixture.symbol),
      style: fixture.styling,
    })),
  },
  {
    id: 'center-images',
    label: 'Center image fixtures',
    source: 'QR_CODE_CENTER_IMAGE_FIXTURES',
    fixtures: QR_CODE_CENTER_IMAGE_FIXTURES.map((fixture) => ({
      id: `center-images/${fixture.name}`,
      category: 'center-images',
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.style,
      centerImage: {image: fixture.image, layout: fixture.layout},
    })),
  },
  {
    id: 'fixture-images',
    label: 'Fixture images',
    source: 'fixture-images.ts',
    fixtures: FIXTURE_IMAGES.map((image) => ({
      id: `fixture-images/${image.name}`,
      category: 'fixture-images',
      name: `${image.name} (${image.width}×${image.height})`,
      payload: 'https://qrcodesdk.dev/guides/center-images/',
      matrix: {version: 6, errorCorrectionLevel: 'H', mask: 2},
      style: {moduleSize: 6, quietZone: 4},
      centerImage: {image},
    })),
  },
];

export function describeMatrix({
  version,
  errorCorrectionLevel,
  mask,
  mode,
  eci,
}: QRCodeMatrixOptions): string {
  return [
    version === undefined ? 'v auto' : `v${version}`,
    `ECC ${errorCorrectionLevel ?? 'M'}`,
    mask === undefined ? 'mask auto' : `mask ${mask}`,
    mode ?? 'mode auto',
    eci ? 'ECI' : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Describes a Micro QR symbol, whose version and mask `describeMatrix` cannot read. */
function describeMicroSymbol({
  version,
  errorCorrectionLevel,
  mask,
  mode,
}: Pick<QRCodeMicroTestFixture, 'version' | 'errorCorrectionLevel' | 'mask'> & {
  readonly mode?: QRCodeMicroTestFixture['mode'];
}): string {
  return [version, `ECC ${errorCorrectionLevel}`, `mask ${mask}`, mode ?? 'mode auto'].join(' · ');
}
