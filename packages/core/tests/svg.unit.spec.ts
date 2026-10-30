import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer} from '../src';

function paths(svg: string): string[] {
  return [...svg.matchAll(/ d="([^"]*)"/g)].map((match) => match[1]!);
}

describe('SVG path data', () => {
  test('chains rectangles with relative moves', () => {
    const svg = QRCodeSVGRenderer({style: {quietZone: 0}})([
      [1, 0],
      [0, 1],
    ]);

    expect(paths(svg)[1]).toBe('M0 0h1v1h-1zm1 1h1v1h-1z');
  });

  test('serializes repeated curved modules to identical relative text', () => {
    const svg = QRCodeSVGRenderer({style: {quietZone: 0, modules: {shape: 'circle'}}})([
      [1, 0, 1, 0, 1],
    ]);
    const circle = 'a0.5 0.5 0 1 1 -1 0a0.5 0.5 0 1 1 1 0z';

    expect(paths(svg)[1]).toBe(`M1 0.5${circle}m2 0${circle}m2 0${circle}`);
  });

  test('uses horizontal and vertical line commands for axis-aligned segments', () => {
    const [, layer] = paths(
      QRCodeSVGRenderer({style: {quietZone: 0, modules: {shape: 'rounded'}}})([[1, 1]]),
    );

    expect(layer).toBe('M1 1v-1h-0.5a0.5 0.5 0 0 0 0 1zm0 -1v1h0.5a0.5 0.5 0 0 0 0 -1z');
  });
});
