import {type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

import type {QRCodeTestFixture} from './fixtures';

export function renderFixture<TOutput>(
  fixture: QRCodeTestFixture,
  renderer: QRCodeRenderer<TOutput>,
): TOutput {
  return qrcode(fixture.data).config(fixture).renderer(renderer).render();
}
