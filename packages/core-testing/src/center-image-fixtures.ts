import type {
  QRCodeCenterImageLayout,
  QRCodeMatrixOptions,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {type QRCodeRMQRVersion, rMQR} from '@qrcodesdk/core/rmqr';
import {alignment, circle, finder, rounded} from '@qrcodesdk/core/style';

import {
  GRADIENT_IMAGE,
  LOGO_IMAGE,
  QRCODESDK_LOGO_IMAGE,
  QRCODESDK_WIDE_LOGO_IMAGE,
  type QRCodeFixtureImage,
  TALL_IMAGE,
  TRANSLUCENT_IMAGE,
  WIDE_IMAGE,
} from './fixture-images';

/**
 * A center-image configuration. Together, the fixtures cover every fixture image and every layout
 * option. Each renderer prepares `image` with its own factory.
 */
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
  fixture('qrcodesdk-logo-square', QRCODESDK_LOGO_IMAGE),
  fixture('qrcodesdk-logo-wide', QRCODESDK_WIDE_LOGO_IMAGE),
  fixture('qrcodesdk-logo-wide-no-padding', QRCODESDK_WIDE_LOGO_IMAGE, {padding: 0}),
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

/** An rMQR center-image configuration, with the symbol its `matrixOptions` select. */
export type QRCodeRMQRCenterImageFixture = QRCodeCenterImageFixture & {
  readonly symbol: QRCodeRMQRVersion;
};

const rmqrPayload = 'https://qrcodesdk.dev';
/** rMQR codes keep the default quiet zone of 2 modules. */
const rmqrStyle: QRCodeVisualStyle = {moduleSize: 6};

function rmqrFixture(
  name: string,
  symbol: QRCodeRMQRVersion,
  image: QRCodeFixtureImage,
  layout?: QRCodeCenterImageLayout,
  fixtureStyle: QRCodeVisualStyle = rmqrStyle,
): QRCodeRMQRCenterImageFixture {
  return {
    name,
    payload: rmqrPayload,
    matrixOptions: {symbol: rMQR({version: symbol}), errorCorrectionLevel: 'H'},
    style: fixtureStyle,
    image,
    layout,
    symbol,
  };
}

/**
 * rMQR center images at level H. The square image box is sized from the height of the code, so only
 * the taller versions keep enough modules to scan.
 */
export const QR_CODE_RMQR_CENTER_IMAGE_FIXTURES: readonly QRCodeRMQRCenterImageFixture[] = [
  rmqrFixture('rmqr-r17x139-qrcodesdk-logo-square', 'R17x139', QRCODESDK_LOGO_IMAGE),
  rmqrFixture('rmqr-r17x139-qrcodesdk-logo-wide', 'R17x139', QRCODESDK_WIDE_LOGO_IMAGE),
  {
    ...rmqrFixture('rmqr-r17x139-qrcodesdk-logo-wide-slash', 'R17x139', QRCODESDK_WIDE_LOGO_IMAGE),
    payload: '/',
  },
  rmqrFixture('rmqr-r11x77-default-layout', 'R11x77', LOGO_IMAGE),
  rmqrFixture('rmqr-r13x99-default-layout', 'R13x99', LOGO_IMAGE),
  rmqrFixture('rmqr-r15x139-default-layout', 'R15x139', LOGO_IMAGE),
  rmqrFixture('rmqr-r17x139-default-layout', 'R17x139', LOGO_IMAGE),
  rmqrFixture('rmqr-r17x139-no-padding', 'R17x139', LOGO_IMAGE, {size: 0.4, padding: 0}),
  rmqrFixture('rmqr-r15x139-keep-background', 'R15x139', TRANSLUCENT_IMAGE, {
    clearBackground: false,
  }),
  rmqrFixture('rmqr-r17x139-wide-image', 'R17x139', WIDE_IMAGE),
  rmqrFixture('rmqr-r17x139-tall-image', 'R17x139', TALL_IMAGE),
  rmqrFixture('rmqr-r17x139-many-colors', 'R17x139', GRADIENT_IMAGE),
  rmqrFixture('rmqr-r17x139-styled', 'R17x139', LOGO_IMAGE, undefined, {
    ...rmqrStyle,
    foreground: '#17365d',
    background: '#fdfaf6',
    modules: rounded(),
    // ZXing cannot reliably locate rMQR codes whose finder ring or finder sub-pattern center is
    // shaped. A separate finder and alignment color on this background fails in browser canvases.
    finder: finder({center: circle()}),
    alignment: alignment({ring: circle()}),
  }),
];
