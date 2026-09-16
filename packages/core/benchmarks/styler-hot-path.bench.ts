import {describe, test} from 'vitest';

import {createQRCodeStyler, qrcode} from '../src';
import type {QRCodeStyledDrawingTarget} from '../src/drawing';
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

const target: QRCodeStyledDrawingTarget = {
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
    test(`version ${String(version)}`, async ({bench}) => {
      const matrix = qrcode('A').options({mode: 'alphanumeric', version, mask: 0}).matrix();
      const styler = createQRCodeStyler(STYLE);
      const drawing = styler.draw(matrix);

      await bench.compare(
        bench('compile style', () => {
          createQRCodeStyler(STYLE);
        }),
        bench('first draw', () => {
          createQRCodeStyler(STYLE).draw(matrix);
        }),
        bench('cached draw', () => {
          styler.draw(matrix);
        }),
        bench('cached repaint', () => {
          drawing.paint(target);
        }),
      );
    });
  }
});
