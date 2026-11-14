import {
  type QRCodeFixtureImage,
  type QRCodeRenderFixtureGroupId,
  QR_CODE_RENDER_FIXTURE_GROUPS,
} from '@repo/core-testing';

import type {
  QRCodeCenterImageLayout,
  QRCodeMatrixOptions,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

import type {KnownDecodeIssues} from '../rendering/decode';

export type FixtureCategoryId = QRCodeRenderFixtureGroupId;

export type CategoryId = FixtureCategoryId | 'all-combinations';

/** One QR code to render: a render fixture of `@repo/core-testing` or a generated combination. */
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

/** The style the roundtrip tests use for the generated combinations. */
export const PLAIN_STYLE: QRCodeVisualStyle = {moduleSize: 4, quietZone: 4};

/** ZXing drops symbols without content. The matrix tests compare the empty payload instead. */
const EMPTY_PAYLOAD_DECODE_ISSUES: KnownDecodeIssues = {
  zxing: 'ZXing ignores QR codes without content.',
};

/**
 * The render fixtures of `@repo/core-testing`, with the same options as the SVG and raster snapshot
 * files that the snapshot tests write to disk.
 */
export const FIXTURE_CATEGORIES: readonly FixtureCategory[] = QR_CODE_RENDER_FIXTURE_GROUPS.map(
  ({id, label, source, fixtures}) => ({
    id,
    label,
    source,
    fixtures: fixtures.map((fixture) => ({
      id: fixture.id,
      category: id,
      name: fixture.name,
      payload: fixture.payload,
      matrix: fixture.matrix,
      style: fixture.style,
      centerImage: fixture.centerImage,
      matrixDescription: fixture.description,
      knownDecodeIssues: fixture.payload === '' ? EMPTY_PAYLOAD_DECODE_ISSUES : undefined,
    })),
  }),
);

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
