import {describe, expect, test} from 'vitest';

import type {QRCodeModuleShape} from '@qrcodesdk/core';
import {circle, diagonal, rounded} from '@qrcodesdk/core/style';

import {rasterizeShapePath} from '../src/raster';

function pixelCoverage(shape: QRCodeModuleShape, neighbors: number, x: number, y: number): number {
  const path = typeof shape.module === 'string' ? shape.module : shape.module[neighbors];
  if (path === undefined) return 16;
  const coverage = rasterizeShapePath(path, 16);
  x -= coverage.x;
  y -= coverage.y;
  if (x < 0 || x >= coverage.width || y < 0 || y >= coverage.height) return 0;
  return coverage.samples[y * coverage.width + x]!;
}

describe('shape path rasterization', () => {
  test.each([
    {name: 'rounded isolated module', shape: rounded(), neighbors: 0, corners: [0, 0, 0, 0]},
    {
      name: 'rounded module beside left and top neighbors',
      shape: rounded(),
      neighbors: 5,
      corners: [16, 16, 0, 16],
    },
    {
      name: 'rounded module between left and right neighbors',
      shape: rounded(),
      neighbors: 3,
      corners: [16, 16, 16, 16],
    },
    {
      name: 'zero-radius module',
      shape: rounded({radius: 0}),
      neighbors: 0,
      corners: [16, 16, 16, 16],
    },
    {name: 'diagonal isolated module', shape: diagonal(), neighbors: 0, corners: [0, 16, 0, 16]},
    {
      name: 'diagonal module beside left and bottom neighbors',
      shape: diagonal(),
      neighbors: 9,
      corners: [16, 16, 16, 16],
    },
  ])('draws $name', ({shape, neighbors, corners}) => {
    expect(
      [
        [0, 0],
        [15, 0],
        [15, 15],
        [0, 15],
      ].map(([x, y]) => pixelCoverage(shape, neighbors, x!, y!)),
    ).toEqual(corners);
  });

  test('uses the full radius for a single free corner and caps corners sharing one side', () => {
    expect(pixelCoverage(rounded(), 5, 12, 12)).toBe(16);
    expect(pixelCoverage(rounded({radius: 1}), 5, 12, 12)).toBe(0);
    expect(pixelCoverage(rounded({radius: 1}), 1, 12, 12)).toBe(16);
  });

  test('centers a smaller circle inside its module', () => {
    expect(pixelCoverage(circle(), 0, 3, 8)).toBe(16);
    expect(pixelCoverage(circle({size: 0.5}), 0, 3, 8)).toBe(0);
    expect(pixelCoverage(circle({size: 0.5}), 0, 4, 8)).toBeGreaterThan(0);
    expect(pixelCoverage(circle({size: 0.5}), 0, 8, 8)).toBe(16);
  });

  test('preserves a cubic curve extending toward its second control point', () => {
    const {width, samples} = rasterizeShapePath('m0 0c0 0 10 0 0 1z', 2);
    // The second control point bends the curve into column 8, beyond a four-segment approximation.
    expect(width).toBe(9);
    expect(samples[8]).toBeGreaterThan(1);
  });
});
