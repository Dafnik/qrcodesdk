import {describe, expect, test} from 'vitest';

import {alignment, circle, diagonal, finder, rounded} from '../src/style';

describe('style option validation', () => {
  test.each([
    [() => rounded({radius: 2}), 'rounded.radius'],
    [() => diagonal({radius: -1}), 'diagonal.radius'],
    [() => circle({size: 0}), 'circle.size'],
    [() => rounded({size: 1} as never), 'rounded.size'],
    [() => finder({color: 'red' as never}), 'finder.color'],
    [() => finder({ring: {finderRing: 'M0 0z'}}), 'finder.ring.finderRing'],
    [() => finder({center: {} as never}), 'finder.center.finderCenter'],
    [() => alignment({ring: {finderRing: 'm0 0z'} as never}), 'alignment.ring.alignmentRing'],
    [() => alignment({color: '#12'}), 'alignment.color'],
    [() => finder({unknown: true} as never), 'finder.unknown'],
  ])('rejects invalid shape or part options %#', (create, field) => {
    expect(create).toThrowError(
      expect.objectContaining({code: 'INVALID_OPTIONS', details: expect.objectContaining({field})}),
    );
  });
});
