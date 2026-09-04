import {describe, expect, test, vi} from 'vitest';

import {createQRCodeStyler, qrcode} from '../src';
import type {QRCodeDrawingTarget} from '../src/drawing';

function target(): QRCodeDrawingTarget {
  return {
    drawBackground: vi.fn(),
    beginLayer: vi.fn(),
    drawRectangle: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    cubicTo: vi.fn(),
    closePath: vi.fn(),
    endPath: vi.fn(),
    endLayer: vi.fn(),
  };
}

describe('createQRCodeStyler', () => {
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
    const placement = drawing.placeImage({size: 0.4, padding: 1});
    expect(placement.image).toEqual({x: 10.3, y: 10.3, size: 8.4});
    expect(placement.clear?.x).toBe(9.3);
    expect(placement.clear?.y).toBe(9.3);
    expect(placement.clear?.size).toBeCloseTo(10.4);
    expect(drawing.placeImage({clearBackground: false}).clear).toBeUndefined();
  });
});
