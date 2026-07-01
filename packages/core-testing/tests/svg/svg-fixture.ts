import {type QRCodeSVGRendererOptions, SVGQRCodeRenderer} from '@qrcodesdk/core';

import {type QRCodeTestFixture, renderFixture} from '../../src';

export function renderFixtureSvg(
  fixture: QRCodeTestFixture,
  options: QRCodeSVGRendererOptions = {size: 8, margin: 4},
): string {
  return renderFixture(fixture, SVGQRCodeRenderer(options));
}
