import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
import {ɵencodeJPEG as encodeJPEG} from '@qrcodesdk/core/internal/jpeg';

import {
  JPEG_PIXELS_PER_MODULE,
  JPEG_QUALITY,
  JPEG_QUIET_ZONE_MODULES,
  createJPEGBenchmarkWorkloads,
  executeJPEGWorkload,
  timedJPEGWorkload,
} from '../src/jpeg';

/** Reads the baseline frame header without interpreting entropy-coded bytes as markers. */
function frame(bytes: Uint8Array): Uint8Array {
  for (let offset = 2; offset < bytes.length && bytes[offset + 1] !== 0xda;) {
    const length = bytes[offset + 2]! * 256 + bytes[offset + 3]!;
    if (bytes[offset + 1] === 0xc0) return bytes.subarray(offset + 4, offset + 2 + length);
    offset += 2 + length;
  }
  throw new Error('Missing baseline JPEG frame');
}

describe('JPEG benchmark', () => {
  const workloads = createJPEGBenchmarkWorkloads();

  test('covers each version with grayscale and color pixels from the same QR matrix', () => {
    expect(workloads.map(({fixtures}) => [fixtures[0].version, fixtures[0].color])).toEqual([
      [1, 'grayscale'],
      [1, 'color'],
      [10, 'grayscale'],
      [10, 'color'],
      [40, 'grayscale'],
      [40, 'color'],
    ]);
    for (const workload of workloads) {
      const {image, version, color} = workload.fixtures[0];
      const matrix = qrcode('JPEG BENCHMARK').options({version, mask: 0}).matrix();
      expect(image.width).toBe((matrix.size + 8) * JPEG_PIXELS_PER_MODULE);
      expect(image.height).toBe(image.width);
      expect(workload.qrCodesPerSample).toBe(workload.fixtures.length * workload.repetitions);
      expect([...image.data.subarray(0, image.width * 4)]).toEqual(
        Array.from({length: image.width * 4}, () => 255),
      );
      const modulePixels = Buffer.alloc(matrix.size * matrix.size * 4);
      const expectedPixels = Buffer.alloc(modulePixels.length);
      const foreground = color === 'grayscale' ? [0, 0, 0, 255] : [16, 48, 128, 255];
      const background = [255, 255, 255, 255];
      for (let y = 0; y < matrix.size; y += 1) {
        for (let x = 0; x < matrix.size; x += 1) {
          const pixelX = (x + JPEG_QUIET_ZONE_MODULES) * JPEG_PIXELS_PER_MODULE;
          const pixelY = (y + JPEG_QUIET_ZONE_MODULES) * JPEG_PIXELS_PER_MODULE;
          const offset = (pixelY * image.width + pixelX) * 4;
          const moduleOffset = (y * matrix.size + x) * 4;
          modulePixels.set(image.data.subarray(offset, offset + 4), moduleOffset);
          expectedPixels.set(
            matrix.modules[y * matrix.size + x] ? foreground : background,
            moduleOffset,
          );
        }
      }
      // Compare every sampled module in one assertion to avoid per-module matcher overhead in CI.
      expect(modulePixels.equals(expectedPixels), workload.label).toBe(true);
    }
  });

  test.each(workloads)(
    '$label encodes as a baseline JPEG with the intended channels',
    (workload) => {
      const {image, color} = workload.fixtures[0];
      const bytes = encodeJPEG(image, {quality: JPEG_QUALITY});
      expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xd8]);
      expect([...bytes.subarray(-2)]).toEqual([0xff, 0xd9]);
      const header = frame(bytes);
      expect(header[0]).toBe(8);
      expect(header[1] * 256 + header[2]).toBe(image.height);
      expect(header[3] * 256 + header[4]).toBe(image.width);
      const channels = color === 'grayscale' ? 1 : 3;
      expect(header[5]).toBe(channels);
      for (let channel = 0; channel < channels; channel += 1) {
        expect(header[7 + channel * 3]).toBe(0x11);
      }
    },
  );

  test('executes every fixture and repetition and consumes the encoded bytes', () => {
    const fixtures = workloads.slice(0, 2).flatMap(({fixtures}) => fixtures);
    const workload = {...workloads[0], fixtures, repetitions: 2, qrCodesPerSample: 4};
    const expected =
      fixtures.reduce(
        (sum, {image}) => sum + encodeJPEG(image, {quality: JPEG_QUALITY}).length,
        0,
      ) * 2;

    expect(executeJPEGWorkload(workload)).toBe(expected);
    expect(timedJPEGWorkload(workload)).toEqual({
      checksum: expected,
      elapsedMs: expect.any(Number),
    });
    expect(executeJPEGWorkload({...workload, repetitions: 0})).toBe(0);
  });
});
