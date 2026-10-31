import {describe, test} from 'vitest';

import {qrcode} from '../src';
import {createQRCodeStyler, toQRCodePathData} from '../src/drawing';
import {circle, finder, rounded} from '../src/style';
import type {QRCodeVersion, QRCodeVisualStyle} from '../src/types';

const VERSIONS = [1, 10, 40] as const satisfies readonly QRCodeVersion[];
const STYLE = {
  background: '#f8fafccc',
  foreground: '#0f172aff',
  modules: rounded(),
  finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#7c3aedff'}),
} as const satisfies QRCodeVisualStyle;

describe('styler hot paths', () => {
  for (const version of VERSIONS) {
    test(`version ${String(version)}`, async ({bench}) => {
      const matrix = qrcode('A').options({mode: 'alphanumeric', version, mask: 0}).matrix();
      const plain = createQRCodeStyler();
      const styled = createQRCodeStyler(STYLE);
      const drawing = styled(matrix);

      await bench.compare(
        bench('create shapes and styler', () => {
          createQRCodeStyler({
            modules: rounded(),
            finder: finder({ring: rounded({radius: 1}), center: circle()}),
          });
        }),
        bench('draw plain', () => {
          plain(matrix);
        }),
        bench('draw styled', () => {
          styled(matrix);
        }),
        bench('serialize styled path data', () => {
          for (const layer of drawing.layers) toQRCodePathData(layer);
        }),
      );
    });
  }
});
