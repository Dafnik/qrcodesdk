import {qrcode} from '@qrcodesdk/core';
import type {QRCodeVersion} from '@qrcodesdk/core';
import {
  type ɵRGBAImage as RGBAImage,
  ɵencodeJPEG as encodeJPEG,
} from '@qrcodesdk/core/internal/jpeg';

import type {BenchmarkWorkload} from './types';

export const JPEG_QUALITY = 92;
export const JPEG_PIXELS_PER_MODULE = 4;
export const JPEG_QUIET_ZONE_MODULES = 4;
export const JPEG_REPETITIONS = 5;
export const JPEG_WARMUP_PASSES = 2;

export interface JPEGBenchmarkFixture {
  readonly version: QRCodeVersion;
  readonly color: 'grayscale' | 'color';
  readonly image: RGBAImage;
}

/** Prepares square-module QR pixels before measuring the encoder. */
export function createJPEGBenchmarkWorkloads(): BenchmarkWorkload<JPEGBenchmarkFixture>[] {
  return ([1, 10, 40] as const).flatMap((version) => {
    const matrix = qrcode('JPEG BENCHMARK').options({version, mask: 0}).matrix();
    const width = (matrix.size + JPEG_QUIET_ZONE_MODULES * 2) * JPEG_PIXELS_PER_MODULE;

    return (['grayscale', 'color'] as const).map((color) => {
      const data = new Uint8Array(width * width * 4).fill(255);
      const foreground = color === 'grayscale' ? [0, 0, 0, 255] : [16, 48, 128, 255];
      for (let y = 0; y < matrix.size; y += 1) {
        for (let x = 0; x < matrix.size; x += 1) {
          if (matrix.modules[y * matrix.size + x] === 0) continue;
          const left = (x + JPEG_QUIET_ZONE_MODULES) * JPEG_PIXELS_PER_MODULE;
          const top = (y + JPEG_QUIET_ZONE_MODULES) * JPEG_PIXELS_PER_MODULE;
          for (let row = top; row < top + JPEG_PIXELS_PER_MODULE; row += 1) {
            for (let column = left; column < left + JPEG_PIXELS_PER_MODULE; column += 1) {
              data.set(foreground, (row * width + column) * 4);
            }
          }
        }
      }

      return {
        id: `jpeg-v${String(version)}-${color}`,
        label: `Version ${String(version)}, ${color}, ${String(width)} × ${String(width)}`,
        fixtures: [{version, color, image: {width, height: width, data}}],
        repetitions: JPEG_REPETITIONS,
        qrCodesPerSample: JPEG_REPETITIONS,
      };
    });
  });
}

export function executeJPEGWorkload(workload: BenchmarkWorkload<JPEGBenchmarkFixture>): number {
  let checksum = 0;
  for (let repetition = 0; repetition < workload.repetitions; repetition += 1) {
    for (const {image} of workload.fixtures) {
      checksum += encodeJPEG(image, {quality: JPEG_QUALITY}).byteLength;
    }
  }
  return checksum;
}

export function timedJPEGWorkload(workload: BenchmarkWorkload<JPEGBenchmarkFixture>): {
  readonly elapsedMs: number;
  readonly checksum: number;
} {
  const start = process.hrtime.bigint();
  const checksum = executeJPEGWorkload(workload);
  return {elapsedMs: Number(process.hrtime.bigint() - start) / 1_000_000, checksum};
}
