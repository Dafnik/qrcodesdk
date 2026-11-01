import {mockCanvasRendering} from '@repo/core-testing';
import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, expectTypeOf, test, vi} from 'vitest';
import {reactive} from 'vue';

import * as vueApi from '../src';

type QRCodeDownloadHandle = import('../src').QRCodeDownloadHandle;
type QRCodeSVGProps = import('../src/QRCodeSVG').QRCodeSVGProps;

describe('Vue QR code component API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('exports the components, shapes, and center-image factories', () => {
    // An exact list keeps internal helpers out of the package root.
    expect(Object.keys(vueApi).sort()).toEqual([
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

  test('includes wrapper attributes', () => {
    expectTypeOf<'id' extends keyof QRCodeSVGProps ? true : false>().toEqualTypeOf<true>();
    expectTypeOf<'onClick' extends keyof QRCodeSVGProps ? true : false>().toEqualTypeOf<true>();
  });

  test('exposes SVG and image download handles', () => {
    const svg = mount(vueApi.QRCodeSVG, {props: {payload: 'HELLO'}});
    const image = mount(vueApi.QRCodeImage, {props: {payload: 'HELLO'}});

    expect((svg.vm as unknown as QRCodeDownloadHandle).download).toBeTypeOf('function');
    expect((image.vm as unknown as QRCodeDownloadHandle).download).toBeTypeOf('function');
  });

  test('keeps factory images valid inside deep reactive options', async () => {
    const options = reactive<vueApi.QRCodeSVGOptions>({
      centerImage: vueApi.svgCenterImage('data:image/png;base64,a'),
    });
    const wrapper = mount(vueApi.QRCodeSVG, {props: {payload: 'reactive image', options}});
    expect(wrapper.find('image').attributes('href')).toBe('data:image/png;base64,a');
    await wrapper.setProps({
      options: reactive<vueApi.QRCodeSVGOptions>({
        centerImage: vueApi.svgCenterImage('data:image/png;base64,b'),
      }),
    });
    expect(wrapper.find('image').attributes('href')).toBe('data:image/png;base64,b');
    wrapper.unmount();
  });
});
