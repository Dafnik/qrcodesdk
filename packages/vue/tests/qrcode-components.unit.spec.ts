import {mockCanvasRendering} from '@repo/core-testing';
import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, expectTypeOf, test, vi} from 'vitest';

import * as vueApi from '../src';

type QRCodeDownloadHandle = import('../src').QRCodeDownloadHandle;
type QRCodeSVGProps = import('../src/QRCodeSVG').QRCodeSVGProps;

describe('Vue QR code component API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('exports only the documented runtime components', () => {
    expect(Object.keys(vueApi).sort()).toEqual(['QRCodeCanvas', 'QRCodeImage', 'QRCodeSVG']);
  });

  test('includes wrapper attributes and excludes managed content attributes', () => {
    expectTypeOf<'id' extends keyof QRCodeSVGProps ? true : false>().toEqualTypeOf<true>();
    expectTypeOf<'onClick' extends keyof QRCodeSVGProps ? true : false>().toEqualTypeOf<true>();
    expectTypeOf<'innerHTML' extends keyof QRCodeSVGProps ? true : false>().toEqualTypeOf<false>();
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
