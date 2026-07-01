import {type QRCodeSVGRendererOptions, SVGQRCodeRenderer, qrcode} from '@qrcodesdk/core';

import {QRCodeTestFixture} from '../../src/fixtures';

export function renderFixtureSvg(
  fixture: QRCodeTestFixture,
  options: QRCodeSVGRendererOptions = {size: 8, margin: 4},
): string {
  return qrcode(fixture.data)
    .mode(fixture.mode)
    .version(fixture.version)
    .mask(fixture.mask)
    .renderer(SVGQRCodeRenderer(options))
    .render();
}
