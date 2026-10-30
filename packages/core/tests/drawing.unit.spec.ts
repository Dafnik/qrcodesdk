import {describe, expect, test, vi} from 'vitest';

import {qrcode} from '../src';
import {createQRCodeStyler} from '../src/drawing';
import type {QRCodeStyledDrawingTarget} from '../src/drawing';

function target(): QRCodeStyledDrawingTarget {
  return {
    drawBackground: vi.fn(),
    beginLayer: vi.fn(),
    drawRectangle: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    endPath: vi.fn(),
    endLayer: vi.fn(),
  };
}

describe('createQRCodeStyler', () => {
  test('does not create empty module layers for a matrix without dark cells', () => {
    const paintTarget = target();
    createQRCodeStyler({modules: {shape: 'square'}})
      .draw([[0]])
      .paint(paintTarget);
    expect(paintTarget.drawBackground).toHaveBeenCalledOnce();
    expect(paintTarget.beginLayer).not.toHaveBeenCalled();
  });

  test('compacts square finder layers while keeping circle modules as paths', () => {
    const paintTarget = target();
    const drawing = createQRCodeStyler({
      modules: {shape: 'circle', color: '#ff0000'},
      finder: {
        outer: {shape: 'square', color: '#0000ff'},
        center: {shape: 'square', color: '#0000ff'},
      },
    }).draw(qrcode('mixed layers').matrix());
    drawing.paint(paintTarget);
    expect(paintTarget.beginLayer).toHaveBeenCalledTimes(2);
    expect(paintTarget.beginLayer).toHaveBeenNthCalledWith(1, 255, 0, 0, 255);
    expect(paintTarget.beginLayer).toHaveBeenNthCalledWith(2, 0, 0, 255, 255);
    expect(paintTarget.drawRectangle).toHaveBeenCalled();
    expect(paintTarget.arc).toHaveBeenCalled();
    const firstPaint = Object.fromEntries(
      Object.entries(paintTarget).map(([name, method]) => [
        name,
        vi.mocked(method).mock.calls.slice(),
      ]),
    );
    const repaintTarget = target();
    drawing.paint(repaintTarget);
    for (const [name, method] of Object.entries(repaintTarget)) {
      expect(vi.mocked(method).mock.calls).toEqual(firstPaint[name]);
    }
  });

  test('snapshots options and caches drawings by matrix identity', () => {
    const style = {moduleSize: 3, quietZone: 2} as const;
    const styler = createQRCodeStyler(style);
    const matrix = qrcode('cache').matrix();
    const first = styler.draw(matrix);
    (style as {moduleSize: number}).moduleSize = 99;

    expect(styler.draw(matrix)).toBe(first);
    expect(first.moduleSize).toBe(3);
    expect(first.quietZone).toBe(2);
    expect(first.outputSize).toBe(first.viewSize * 3);
  });

  test('paints balanced layers with integer RGBA channels', () => {
    const drawing = createQRCodeStyler({
      background: '#11223344',
      modules: {shape: 'extra-rounded', color: '#aabbccdd'},
      finder: {outer: {shape: 'extra-rounded'}, center: {shape: 'rounded'}},
    }).draw(qrcode('paint').matrix());
    const paintTarget = target();

    drawing.paint(paintTarget);

    expect(paintTarget.drawBackground).toHaveBeenCalledWith(17, 34, 51, 68);
    expect(paintTarget.beginLayer).toHaveBeenCalled();
    expect(paintTarget.beginLayer).toHaveBeenCalledTimes(
      (paintTarget.endLayer as ReturnType<typeof vi.fn>).mock.calls.length,
    );
    expect(paintTarget.arc).toHaveBeenCalled();
  });

  test('centralizes image placement', () => {
    const drawing = createQRCodeStyler({quietZone: 4}).draw(qrcode('image').matrix());
    const placement = drawing.placeCenterImage({size: 0.4, padding: 1});
    expect(placement.centerImage).toEqual({x: 10.3, y: 10.3, size: 8.4});
    expect(placement.clear?.x).toBe(9.3);
    expect(placement.clear?.y).toBe(9.3);
    expect(placement.clear?.size).toBeCloseTo(10.4);
    expect(drawing.placeCenterImage({clearBackground: false}).clear).toBeUndefined();
  });

  test.each(['outer', 'center'] as const)(
    'draws extra-rounded finder %s with corners between rounded and circle',
    (part) => {
      const matrix = qrcode('finder shapes').matrix();
      const [rounded, extraRounded, circle] = (['rounded', 'extra-rounded', 'circle'] as const).map(
        (shape) => {
          const paintTarget = target();
          createQRCodeStyler({finder: {[part]: {shape}}})
            .draw(matrix)
            .paint(paintTarget);
          return paintTarget;
        },
      );
      const roundedRadius = vi.mocked(rounded!.arc).mock.calls[0]![2];
      const extraRoundedArcs = vi.mocked(extraRounded!.arc).mock.calls;
      const extraRoundedRadius = extraRoundedArcs[0]![2];
      const circleRadius = vi.mocked(circle!.arc).mock.calls[0]![2];

      expect(extraRoundedRadius).toBeGreaterThan(roundedRadius);
      expect(extraRoundedRadius).toBeLessThan(circleRadius);
      const start = vi.mocked(extraRounded!.moveTo).mock.calls[0]!;
      const end = vi.mocked(extraRounded!.lineTo).mock.calls[0]!;
      expect(end[0]).toBeGreaterThan(start[0]);
      expect(end[1]).toBe(start[1]);

      if (part === 'outer') {
        const innerRadius = extraRoundedArcs[4]![2];
        expect(extraRoundedRadius - innerRadius).toBeCloseTo(1);
      }
    },
  );
});
