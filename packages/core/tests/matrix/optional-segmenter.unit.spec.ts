import {describe, expect, test, vi} from 'vitest';

import {type QRCodeSegmenter, qrcode} from '../../src';
import {resolveQRCodeMatrixOptions} from '../../src/matrix/resolve-matrix-options';
import {automaticSegmenter} from '../../src/segmenter';

const MIXED = 'ABCD12345678901234567890abcd';

describe('optional segmentation', () => {
  test.each(['', '00123', 0, 12345, 'HELLO WORLD', 'hello', '✅🚀', '\ud800'])(
    'allows explicit auto without a segmenter for %s',
    (payload) => {
      expect(qrcode(payload).mode('auto').matrix()).toEqual(qrcode(payload).matrix());
    },
  );

  test('auto detects one mode without optimization and supports resetting a forced mode', () => {
    const single = qrcode(MIXED).mode('octet').mask(0).matrix();
    expect(qrcode(MIXED).mode('auto').mask(0).matrix()).toEqual(single);
    expect(qrcode(MIXED).mode('numeric').mode('auto').mask(0).matrix()).toEqual(single);
    expect(qrcode(MIXED).mode('numeric').mode().mask(0).matrix()).toEqual(single);
    expect(single.size).toBe(29);
  });

  test('auto uses an optional segmenter and can reset it without changing the original builder', () => {
    const segmenter = vi.fn(automaticSegmenter);
    const original = qrcode(MIXED).mode('auto').segmenter(segmenter).mask(0);
    const optimized = original.matrix();
    expect(optimized.size).toBe(25);
    expect(segmenter).toHaveBeenCalledExactlyOnceWith(MIXED, {version: 1, eci: false});
    expect(original.matrix()).toBe(optimized);
    expect(original.render((matrix) => matrix)).toBe(optimized);
    expect(segmenter).toHaveBeenCalledTimes(1);
    expect(original.segmenter().matrix()).toEqual(qrcode(MIXED).mask(0).matrix());
    expect(qrcode(MIXED).options({segmenter: automaticSegmenter}).mask(0).matrix()).toEqual(
      optimized,
    );
  });

  test.each(['numeric', 'alphanumeric', 'octet'] as const)(
    'never invokes a supplied segmenter for explicit %s mode',
    (mode) => {
      const segmenter = vi.fn(() => {
        throw new Error('must not run');
      });
      expect(qrcode('12345').mode(mode).segmenter(segmenter).matrix()).toEqual(
        qrcode('12345').mode(mode).matrix(),
      );
      expect(segmenter).not.toHaveBeenCalled();
    },
  );

  test.each([1, 9, 10, 26, 27, 40] as const)('segments once at pinned version %s', (version) => {
    const segmenter = vi.fn(automaticSegmenter);
    qrcode('A✅1234').mode('auto').segmenter(segmenter).version(version).eci(true).matrix();
    expect(segmenter).toHaveBeenCalledExactlyOnceWith('A✅1234', {version, eci: true});
  });

  test('segments only once per searched version group', () => {
    const payload = '1'.repeat(4000);
    const segmenter = vi.fn(automaticSegmenter);
    const result = resolveQRCodeMatrixOptions(payload, {mode: 'auto', segmenter, eci: true});
    expect(result.version).toBeGreaterThanOrEqual(27);
    expect(segmenter.mock.calls.map(([, {version}]) => version)).toEqual([1, 10, 27]);
  });

  test('retains capacity errors when single-mode detection cannot fit the selected version', () => {
    expect(() => qrcode(MIXED).mode('auto').version(2).matrix()).toThrow('Payload too large');
    expect(qrcode(MIXED).mode('auto').segmenter(automaticSegmenter).version(2).matrix().size).toBe(
      25,
    );
  });

  test('validates numbers before invoking the segmenter', () => {
    const segmenter = vi.fn(automaticSegmenter);
    for (const payload of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => qrcode(payload).mode('auto').segmenter(segmenter).matrix()).toThrow(
        'Invalid payload',
      );
    }
    expect(segmenter).not.toHaveBeenCalled();
  });

  test.each([
    {segments: []},
    {segments: [{mode: 'numeric', payload: MIXED}]},
    {segments: [{mode: 'auto', payload: MIXED}]},
    {segments: [{mode: 'octet', payload: 'changed payload'}]},
  ])('rejects invalid or payload-changing segmenter results: %j', ({segments}) => {
    const segmenter = (() => segments) as unknown as QRCodeSegmenter;
    expect(() => qrcode(MIXED).segmenter(segmenter).matrix()).toThrow('Invalid payload');
  });
});
