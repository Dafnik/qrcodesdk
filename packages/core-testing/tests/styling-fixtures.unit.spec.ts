import {describe, expect, test} from 'vitest';

import {createQRCodeStyler, qrcode} from '@qrcodesdk/core';

import {QR_CODE_STYLING_FIXTURES, QR_CODE_STYLING_ROUNDTRIP_FIXTURES} from '../src';

describe('QR_CODE_STYLING_FIXTURES', () => {
  test('provides 60 unique, valid production style cases', () => {
    expect(QR_CODE_STYLING_FIXTURES).toHaveLength(60);
    expect(new Set(QR_CODE_STYLING_FIXTURES.map(({name}) => name)).size).toBe(60);
    for (const fixture of QR_CODE_STYLING_FIXTURES) {
      const matrix = qrcode(fixture.payload).options(fixture.matrixOptions).matrix();
      const drawing = createQRCodeStyler(fixture.styling).draw(matrix);
      expect(drawing.moduleSize).toBe(12);
      expect(drawing.quietZone).toBe(4);
      expect(drawing.outputSize).toBeGreaterThan(0);
    }
  });

  test('covers every public module and finder shape', () => {
    expect(new Set(QR_CODE_STYLING_FIXTURES.map(({styling}) => styling.modules?.shape))).toEqual(
      new Set(['square', 'circle', 'rounded', 'extra-rounded', 'diagonal', 'diagonal-rounded']),
    );
    const finderShapes = QR_CODE_STYLING_FIXTURES.flatMap(({styling}) => [
      styling.finder?.outer?.shape,
      styling.finder?.center?.shape,
    ]);
    expect(new Set(finderShapes)).toEqual(
      new Set(['square', 'rounded', 'extra-rounded', 'circle']),
    );
  });

  test('covers every shape and palette pair', () => {
    const palettes = new Set(['default', 'navy', 'jewel', 'slate', 'mono', 'mixed']);
    const pairs = [
      [
        'modules',
        (styling: (typeof QR_CODE_STYLING_FIXTURES)[number]['styling']) => styling.modules?.shape,
      ],
      [
        'outer',
        (styling: (typeof QR_CODE_STYLING_FIXTURES)[number]['styling']) =>
          styling.finder?.outer?.shape,
      ],
      [
        'center',
        (styling: (typeof QR_CODE_STYLING_FIXTURES)[number]['styling']) =>
          styling.finder?.center?.shape,
      ],
    ] as const;

    for (const [, getShape] of pairs) {
      const shapes = new Set(QR_CODE_STYLING_FIXTURES.map(({styling}) => getShape(styling)));
      for (const shape of shapes) {
        const coveredPalettes = new Set(
          QR_CODE_STYLING_FIXTURES.filter(({styling}) => getShape(styling) === shape).map(
            ({name}) => name.match(/palette-(.+)$/u)?.[1],
          ),
        );
        expect(coveredPalettes).toEqual(palettes);
      }
    }
  });

  test('keeps scanner-sensitive combinations out of the roundtrip contract', () => {
    expect(QR_CODE_STYLING_ROUNDTRIP_FIXTURES).toHaveLength(57);
    expect(
      QR_CODE_STYLING_ROUNDTRIP_FIXTURES.every((fixture) =>
        QR_CODE_STYLING_FIXTURES.includes(fixture),
      ),
    ).toBe(true);
  });
});
