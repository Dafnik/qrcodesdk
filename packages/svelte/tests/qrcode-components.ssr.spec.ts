// @vitest-environment node
import {render} from 'svelte/server';
import {describe, expect, test} from 'vitest';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '../src/lib/index.js';

const svgOptions: QRCodeSVGOptions = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions: QRCodeImageOptions = {style: {moduleSize: 2, quietZone: 1}};
const canvasOptions: QRCodeCanvasOptions = {style: {moduleSize: 2, quietZone: 1}};

describe('Svelte QR code server rendering', () => {
  test('renders SVG but no browser elements during SSR', () => {
    const svg = render(QRCodeSVG, {props: {data: 'HELLO', options: svgOptions, id: 'ssr'}});
    const image = render(QRCodeImage, {props: {data: 'HELLO', options: imageOptions}});
    const canvas = render(QRCodeCanvas, {props: {data: 'HELLO', options: canvasOptions}});

    expect(svg.body).toContain('<svg');
    expect(svg.body).toContain('id="ssr"');
    expect(image.body).not.toContain('<img');
    expect(canvas.body).not.toContain('<canvas');
  });
});
