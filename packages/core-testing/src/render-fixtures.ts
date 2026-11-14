import type {
  QRCodeCenterImageLayout,
  QRCodeEncodingMode,
  QRCodeMatrixOptions,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

import {QR_CODE_CENTER_IMAGE_FIXTURES} from './center-image-fixtures';
import {
  GRADIENT_IMAGE,
  LOGO_IMAGE,
  type QRCodeFixtureImage,
  TALL_IMAGE,
  TRANSLUCENT_IMAGE,
  WIDE_IMAGE,
} from './fixture-images';
import {QR_CODE_TEST_FIXTURES, fixtureMatrixOptions} from './fixtures';
import {
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  fixtureMicroMatrixOptions,
} from './micro-fixtures';
import {
  QR_CODE_RMQR_STYLE_VARIANT_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  fixtureRMQRMatrixOptions,
} from './rmqr-fixtures';
import {QR_CODE_STYLE_VARIANT_FIXTURES} from './style-variant-fixtures';
import {QR_CODE_STYLING_FIXTURES} from './styling-fixtures';

export type QRCodeRenderFixtureGroupId =
  | 'fixtures'
  | 'micro'
  | 'rmqr'
  | 'styling'
  | 'style-variants'
  | 'micro-style-variants'
  | 'rmqr-style-variants'
  | 'center-images'
  | 'fixture-images';

/**
 * One QR code with every option a graphical renderer needs. The snapshot tests and the docs dev
 * tools render the same fixtures with the same options.
 */
export type QRCodeRenderFixture = {
  /** `group/name`, unique across all groups. */
  readonly id: string;
  readonly group: QRCodeRenderFixtureGroupId;
  readonly name: string;
  readonly payload: string;
  readonly matrix: QRCodeMatrixOptions;
  readonly style: QRCodeVisualStyle;
  readonly centerImage?: {
    readonly image: QRCodeFixtureImage;
    readonly layout?: QRCodeCenterImageLayout;
  };
  /** Describes symbols whose matrix options hide their version and mask, such as Micro QR codes. */
  readonly description?: string;
  /** The snapshot file path relative to a renderer's snapshot directory, without an extension. */
  readonly snapshotPath: string;
};

export type QRCodeRenderFixtureGroup = {
  readonly id: QRCodeRenderFixtureGroupId;
  readonly label: string;
  /** The `@repo/core-testing` export the fixtures come from. */
  readonly source: string;
  readonly fixtures: readonly QRCodeRenderFixture[];
};

/** The style of fixtures without their own style. */
const STANDARD_STYLE: QRCodeVisualStyle = {moduleSize: 8, quietZone: 4};
/** Micro QR and rMQR fixtures keep the default quiet zone of 2 modules. */
const SMALL_SYMBOL_STYLE: QRCodeVisualStyle = {moduleSize: 8};

/** Every fixture image, each in the center of the same QR code with the default layout. */
const FIXTURE_IMAGES: readonly QRCodeFixtureImage[] = [
  LOGO_IMAGE,
  WIDE_IMAGE,
  TALL_IMAGE,
  GRADIENT_IMAGE,
  TRANSLUCENT_IMAGE,
];

function group(
  id: QRCodeRenderFixtureGroupId,
  label: string,
  source: string,
  directory: string,
  fixtures: readonly Omit<QRCodeRenderFixture, 'id' | 'group' | 'snapshotPath'>[],
): QRCodeRenderFixtureGroup {
  return {
    id,
    label,
    source,
    fixtures: fixtures.map((fixture) => ({
      ...fixture,
      id: `${id}/${fixture.name}`,
      group: id,
      snapshotPath: directory ? `${directory}/${fixture.name}` : fixture.name,
    })),
  };
}

function describeSymbol(
  version: string,
  errorCorrectionLevel: string,
  mode: QRCodeEncodingMode | undefined,
  mask?: number,
): string {
  return [
    version,
    `ECC ${errorCorrectionLevel}`,
    mask === undefined ? undefined : `mask ${String(mask)}`,
    mode ?? 'mode auto',
  ]
    .filter((part) => part !== undefined)
    .join(' · ');
}

/** The fixtures that the SVG and raster snapshot tests write to disk, grouped like the dev tools. */
export const QR_CODE_RENDER_FIXTURE_GROUPS: readonly QRCodeRenderFixtureGroup[] = [
  group(
    'fixtures',
    'Fixtures',
    'QR_CODE_TEST_FIXTURES',
    '',
    QR_CODE_TEST_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureMatrixOptions(fixture),
      style: STANDARD_STYLE,
    })),
  ),
  group(
    'micro',
    'Micro QR fixtures',
    'QR_CODE_MICRO_TEST_FIXTURES',
    'micro',
    QR_CODE_MICRO_TEST_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureMicroMatrixOptions(fixture),
      style: SMALL_SYMBOL_STYLE,
      description: describeSymbol(
        fixture.version,
        fixture.errorCorrectionLevel,
        fixture.mode,
        fixture.mask,
      ),
    })),
  ),
  group(
    'rmqr',
    'rMQR fixtures',
    'QR_CODE_RMQR_TEST_FIXTURES',
    'rmqr',
    QR_CODE_RMQR_TEST_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixtureRMQRMatrixOptions(fixture),
      style: SMALL_SYMBOL_STYLE,
      description: describeSymbol(fixture.symbol, fixture.errorCorrectionLevel, fixture.mode),
    })),
  ),
  group(
    'styling',
    'Styling fixtures',
    'QR_CODE_STYLING_FIXTURES',
    'styling',
    QR_CODE_STYLING_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.styling,
    })),
  ),
  group(
    'style-variants',
    'Style variant fixtures',
    'QR_CODE_STYLE_VARIANT_FIXTURES',
    'style-variants',
    QR_CODE_STYLE_VARIANT_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.styling,
    })),
  ),
  group(
    'micro-style-variants',
    'Micro QR style variant fixtures',
    'QR_CODE_MICRO_STYLE_VARIANT_FIXTURES',
    'micro/style-variants',
    QR_CODE_MICRO_STYLE_VARIANT_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.styling,
      description: describeSymbol(
        fixture.symbol.version,
        fixture.symbol.errorCorrectionLevel,
        undefined,
        fixture.symbol.mask,
      ),
    })),
  ),
  group(
    'rmqr-style-variants',
    'rMQR style variant fixtures',
    'QR_CODE_RMQR_STYLE_VARIANT_FIXTURES',
    'rmqr/style-variants',
    QR_CODE_RMQR_STYLE_VARIANT_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.styling,
      description: describeSymbol(fixture.symbol, 'M', undefined),
    })),
  ),
  group(
    'center-images',
    'Center image fixtures',
    'QR_CODE_CENTER_IMAGE_FIXTURES',
    'center-image',
    QR_CODE_CENTER_IMAGE_FIXTURES.map((fixture) => ({
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrixOptions,
      style: fixture.style,
      centerImage: {image: fixture.image, layout: fixture.layout},
    })),
  ),
  group(
    'fixture-images',
    'Fixture images',
    'fixture-images.ts',
    'fixture-images',
    FIXTURE_IMAGES.map((image) => ({
      name: image.name,
      payload: 'https://qrcodesdk.dev/guides/center-images/',
      matrix: {version: 6, errorCorrectionLevel: 'H', mask: 2},
      style: {moduleSize: 6, quietZone: 4},
      centerImage: {image},
      description: `${String(image.width)}×${String(image.height)} image · v6 · ECC H · mask 2`,
    })),
  ),
];

/** Every render fixture of every group. */
export const QR_CODE_RENDER_FIXTURES: readonly QRCodeRenderFixture[] =
  QR_CODE_RENDER_FIXTURE_GROUPS.flatMap(({fixtures}) => fixtures);
