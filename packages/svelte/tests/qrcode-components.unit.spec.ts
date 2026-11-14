import {mockCanvasRendering} from '@repo/core-testing';
import {fireEvent, render} from '@testing-library/svelte';
import {beforeEach, describe, expect, test, vi} from 'vitest';

import * as svelteApi from '../src/lib/index.js';
import ReactiveCenterImage from './ReactiveCenterImage.svelte';

describe('Svelte QR code component API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('exposes SVG and image download handles', () => {
    const svg = render(svelteApi.QRCodeSVG, {payload: 'HELLO'});
    const image = render(svelteApi.QRCodePNG, {payload: 'HELLO'});

    expect(svg.component.download).toBeTypeOf('function');
    expect(image.component.download).toBeTypeOf('function');
  });

  test('renders a Micro QR code through the matrix options', () => {
    const {container} = render(svelteApi.QRCodeSVG, {
      payload: '12345',
      options: {matrix: {symbol: svelteApi.microQR()}},
    });

    expect(container.innerHTML).toContain('viewBox="0 0 17 17"');
  });

  test('keeps factory images valid inside deep reactive options', async () => {
    const {container, getByRole} = render(ReactiveCenterImage);
    expect(container.querySelector('image')?.getAttribute('href')).toBe('data:image/png;base64,a');
    await fireEvent.click(getByRole('button', {name: 'Change image'}));
    expect(container.querySelector('image')?.getAttribute('href')).toBe('data:image/png;base64,b');
  });
});
