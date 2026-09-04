import {bench, describe} from 'vitest';

import {createQRCodeStyler, qrcode} from '../src';
import type {QRCodeDrawingTarget} from '../src/drawing';
import type {QRCodeVersion, QRCodeVisualStyle} from '../src/types';

const VERSIONS = [1, 10, 40] as const satisfies readonly QRCodeVersion[];
const STYLE = {
  background: '#f8fafccc',
  foreground: '#0f172aff',
  modules: {shape: 'rounded' as const},
  finder: {
    outer: {shape: 'extra-rounded' as const, color: '#7c3aedff'},
    center: {shape: 'circle' as const, color: '#2563ebff'},
  },
} as const satisfies QRCodeVisualStyle;

const target: QRCodeDrawingTarget = {
  drawBackground() {},
  beginLayer() {},
  drawRectangle() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  cubicTo() {},
  closePath() {},
  endPath() {},
  endLayer() {},
};

describe('styler hot paths', () => {
  for (const version of VERSIONS) {
    const matrix = qrcode('A').config({mode: 'alphanumeric', version, mask: 0}).matrix();
    const styler = createQRCodeStyler(STYLE);
    const drawing = styler.draw(matrix);

    bench(`compile style version ${String(version)}`, () => {
      createQRCodeStyler(STYLE);
    });

    bench(`first draw version ${String(version)}`, () => {
      createQRCodeStyler(STYLE).draw(matrix);
    });

    bench(`cached draw version ${String(version)}`, () => {
      styler.draw(matrix);
    });

    bench(`cached repaint version ${String(version)}`, () => {
      drawing.paint(target);
    });
  }
});
