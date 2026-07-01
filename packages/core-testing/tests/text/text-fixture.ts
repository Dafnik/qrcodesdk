import {QRCodeTextRenderer, type QRCodeTextRendererOptions} from '@qrcodesdk/core';

import {type QRCodeTestFixture, renderFixture} from '../../src';

export function renderFixtureText(
  fixture: QRCodeTestFixture,
  options: QRCodeTextRendererOptions = {size: 2, margin: 4},
): string {
  return renderFixture(fixture, QRCodeTextRenderer(options));
}
