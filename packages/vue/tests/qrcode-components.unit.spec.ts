import {mockCanvasRendering} from '@repo/core-testing';
import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, test, vi} from 'vitest';

import * as vueApi from '../src';

type QRCodeDownloadHandle = import('../src').QRCodeDownloadHandle;

describe('Vue QR code component API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('exports only the documented runtime components', () => {
    expect(Object.keys(vueApi).sort()).toEqual(['QRCodeCanvas', 'QRCodeImage', 'QRCodeSVG']);
  });

  test('exposes download handles only for SVG and image components', () => {
    const svg = mount(vueApi.QRCodeSVG, {props: {payload: 'HELLO'}});
    const image = mount(vueApi.QRCodeImage, {props: {payload: 'HELLO'}});
    const canvas = mount(vueApi.QRCodeCanvas, {props: {payload: 'HELLO'}});

    expect((svg.vm as unknown as QRCodeDownloadHandle).download).toBeTypeOf('function');
    expect((image.vm as unknown as QRCodeDownloadHandle).download).toBeTypeOf('function');
    expect('download' in canvas.vm).toBe(false);
  });
});
