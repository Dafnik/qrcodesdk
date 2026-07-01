import {type QRCodeTestFixture, renderFixture} from '@qrcodesdk/core-testing';

import {PNGQRCodeRenderer, type QRCodePNGRendererOptions} from '../../src';

export function renderFixturePng(
  fixture: QRCodeTestFixture,
  options: QRCodePNGRendererOptions = {size: 8, margin: 4},
): Buffer {
  return renderFixture(fixture, PNGQRCodeRenderer(options));
}
