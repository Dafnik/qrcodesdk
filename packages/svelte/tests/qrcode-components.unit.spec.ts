import {mockCanvasRendering} from '@repo/core-testing';
import {render} from '@testing-library/svelte';
import {beforeEach, describe, expect, test, vi} from 'vitest';

import * as svelteApi from '../src/lib/index.js';

describe('Svelte QR code component API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('exports only the documented runtime components', () => {
    expect(Object.keys(svelteApi).sort()).toEqual(['QRCodeCanvas', 'QRCodeImage', 'QRCodeSVG']);
  });

  test('exposes download handles only for SVG and image components', () => {
    const svg = render(svelteApi.QRCodeSVG, {data: 'HELLO'});
    const image = render(svelteApi.QRCodeImage, {data: 'HELLO'});
    const canvas = render(svelteApi.QRCodeCanvas, {data: 'HELLO'});

    expect(svg.component.download).toBeTypeOf('function');
    expect(image.component.download).toBeTypeOf('function');
    expect('download' in canvas.component).toBe(false);
  });
});
