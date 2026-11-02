import type {
  QRCodeCenterImageLayout,
  QRCodeMatrixOptions,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {alignment, circle, finder, rounded} from '@qrcodesdk/core/style';

import {
  GRADIENT_IMAGE,
  LOGO_IMAGE,
  type QRCodeFixtureImage,
  TALL_IMAGE,
  TRANSLUCENT_IMAGE,
  WIDE_IMAGE,
} from './fixture-images';

/** A center-image configuration. Each renderer prepares `image` with its own factory. */
export type QRCodeCenterImageFixture = {
  readonly name: string;
  readonly payload: string;
  readonly matrixOptions: QRCodeMatrixOptions;
  readonly style: QRCodeVisualStyle;
  readonly image: QRCodeFixtureImage;
  readonly layout?: QRCodeCenterImageLayout;
};

const payload = 'https://qrcodesdk.dev/guides/center-images/';
const matrixOptions: QRCodeMatrixOptions = {version: 6, errorCorrectionLevel: 'H', mask: 2};
const style: QRCodeVisualStyle = {moduleSize: 6, quietZone: 4};

function fixture(
  name: string,
  image: QRCodeFixtureImage,
  layout?: QRCodeCenterImageLayout,
  fixtureStyle: QRCodeVisualStyle = style,
): QRCodeCenterImageFixture {
  return {name, payload, matrixOptions, style: fixtureStyle, image, layout};
}

export const QR_CODE_CENTER_IMAGE_FIXTURES: readonly QRCodeCenterImageFixture[] = [
  fixture('default-layout', LOGO_IMAGE),
  fixture('small-no-padding', LOGO_IMAGE, {size: 0.16, padding: 0}),
  fixture('fractional-padding', LOGO_IMAGE, {size: 0.2, padding: 0.5}),
  fixture('keep-background', TRANSLUCENT_IMAGE, {size: 0.2, clearBackground: false}),
  fixture('wide-image', WIDE_IMAGE, {size: 0.24}),
  fixture('tall-image', TALL_IMAGE, {size: 0.24}),
  fixture('many-colors', GRADIENT_IMAGE, {size: 0.24}),
  fixture('styled', LOGO_IMAGE, undefined, {
    ...style,
    foreground: '#17365d',
    background: '#fdfaf6',
    modules: rounded(),
    finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#4c285e'}),
    alignment: alignment({ring: circle(), color: '#4c285e'}),
  }),
  fixture('transparent-background', LOGO_IMAGE, {size: 0.2}, {...style, background: '#ffffff00'}),
];
