import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
import {createQRCodeStyler} from '@qrcodesdk/core/drawing';

import {QR_CODE_STYLING_FIXTURES, QR_CODE_STYLING_ROUNDTRIP_FIXTURES} from '../src';

describe('QR_CODE_STYLING_FIXTURES', () => {
  test('provides 60 distinct style fixtures', () => {
    expect(QR_CODE_STYLING_FIXTURES).toHaveLength(60);
    expect(new Set(QR_CODE_STYLING_FIXTURES.map(({name}) => name)).size).toBe(60);
    for (const fixture of QR_CODE_STYLING_FIXTURES) {
      const matrix = qrcode(fixture.payload).options(fixture.matrixOptions).matrix();
      const drawing = createQRCodeStyler(fixture.styling)(matrix);
      expect(drawing.moduleSize).toBe(12);
      expect(drawing.quietZone).toBe(4);
      expect(drawing.outputSize).toBeGreaterThan(0);
    }
  });

  test('covers every module and finder shape', () => {
    expect(new Set(QR_CODE_STYLING_FIXTURES.map(({design}) => design.modules))).toEqual(
      new Set(['square', 'circle', 'rounded', 'extra-rounded', 'diagonal', 'diagonal-rounded']),
    );
    const finderShapes = QR_CODE_STYLING_FIXTURES.flatMap(({design}) => [
      design.finder.ring,
      design.finder.center,
    ]);
    expect(new Set(finderShapes)).toEqual(
      new Set(['square', 'rounded', 'extra-rounded', 'circle']),
    );
  });

  test('covers every shape and palette pair', () => {
    const palettes = new Set(['default', 'navy', 'jewel', 'slate', 'mono', 'mixed']);
    const getters = [
      ({design}: (typeof QR_CODE_STYLING_FIXTURES)[number]) => design.modules,
      ({design}: (typeof QR_CODE_STYLING_FIXTURES)[number]) => design.finder.ring,
      ({design}: (typeof QR_CODE_STYLING_FIXTURES)[number]) => design.finder.center,
    ];

    for (const getShape of getters) {
      for (const shape of new Set(QR_CODE_STYLING_FIXTURES.map(getShape))) {
        const coveredPalettes = new Set(
          QR_CODE_STYLING_FIXTURES.filter((fixture) => getShape(fixture) === shape).map(
            ({name}) => name.match(/palette-(.+)$/u)?.[1],
          ),
        );
        expect(coveredPalettes).toEqual(palettes);
      }
    }
  });

  test('keeps scanner-sensitive combinations out of the roundtrip contract', () => {
    expect(QR_CODE_STYLING_ROUNDTRIP_FIXTURES).toHaveLength(58);
    expect(
      QR_CODE_STYLING_ROUNDTRIP_FIXTURES.every((fixture) =>
        QR_CODE_STYLING_FIXTURES.includes(fixture),
      ),
    ).toBe(true);
  });
});
