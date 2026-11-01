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

  test('exports the components, shapes, and center-image factories', () => {
    // An exact list keeps internal helpers out of the package root.
    expect(Object.keys(svelteApi).sort()).toEqual([
      'QRCodeCanvas',
      'QRCodeImage',
      'QRCodeSVG',
      'alignment',
      'canvasCenterImage',
      'circle',
      'customShape',
      'diagonal',
      'finder',
      'rounded',
      'svgCenterImage',
    ]);
  });

  test('exposes SVG and image download handles', () => {
    const svg = render(svelteApi.QRCodeSVG, {payload: 'HELLO'});
    const image = render(svelteApi.QRCodeImage, {payload: 'HELLO'});

    expect(svg.component.download).toBeTypeOf('function');
    expect(image.component.download).toBeTypeOf('function');
  });

  test('keeps factory images valid inside deep reactive options', async () => {
    const {container, getByRole} = render(ReactiveCenterImage);
    expect(container.querySelector('image')?.getAttribute('href')).toBe('data:image/png;base64,a');
    await fireEvent.click(getByRole('button', {name: 'Change image'}));
    expect(container.querySelector('image')?.getAttribute('href')).toBe('data:image/png;base64,b');
  });
});
