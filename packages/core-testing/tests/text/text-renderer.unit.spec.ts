import {describe, expect, test} from 'vitest';

import {QRCodeTextRenderer} from '@qrcodesdk/core';

import {matrixFromRows} from '../../src';

describe('QRCodeTextRenderer', () => {
  const matrix = matrixFromRows([
    [1, 0],
    [0, 1],
  ]);

  test('renders compact and full layouts', () => {
    expect(
      QRCodeTextRenderer({style: {moduleSize: 1, quietZone: 0}, layout: 'compact'})(matrix),
    ).toBe('▀▄');
    expect(QRCodeTextRenderer({style: {moduleSize: 1, quietZone: 0}, layout: 'full'})(matrix)).toBe(
      '██  \n  ██',
    );
  });

  test('supports ANSI block and background modes', () => {
    const blocks = QRCodeTextRenderer({
      style: {moduleSize: 1, quietZone: 0},
      ansi: {foreground: '#112233', background: '#fefefe'},
    })(matrix);
    expect(blocks).toContain('\u001b[38;2;17;34;51m');
    expect(blocks).toContain('\u001b[48;2;254;254;254m');

    const background = QRCodeTextRenderer({
      style: {moduleSize: 1, quietZone: 0},
      ansi: {mode: 'background'},
    })(matrix);
    expect(background.split('\n')).toHaveLength(2);
    expect(background).not.toContain('█');
  });

  test('snapshots options when the renderer is created', () => {
    const options = {style: {moduleSize: 1, quietZone: 0}};
    const renderer = QRCodeTextRenderer(options);
    options.style.moduleSize = 4;
    expect(renderer(matrixFromRows([[1]]))).toBe('▀');
  });
});
