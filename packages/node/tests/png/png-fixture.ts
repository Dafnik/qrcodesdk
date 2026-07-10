import {type QRCodeTestFixture, renderFixture} from '@repo/core-testing';

import {QRCodePNGRenderer, type QRCodePNGRendererOptions} from '../../src';

export function renderFixturePng(
  fixture: QRCodeTestFixture,
  options: QRCodePNGRendererOptions = {size: 8, margin: 4},
): Buffer {
  return renderFixture(fixture, QRCodePNGRenderer(options));
}
