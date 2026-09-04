import {captureDownloads, mockCanvasRendering} from '@repo/core-testing';
import {renderToString} from '@vue/server-renderer';
import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import {createSSRApp, defineComponent, h, nextTick, ref} from 'vue';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';

import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '../src';

const svgOptions: QRCodeSVGOptions = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions: QRCodeImageOptions = {
  style: {moduleSize: 2, quietZone: 1},
  accessibility: {alt: 'QR alt', ariaLabel: 'QR aria', title: 'QR title'},
};
const canvasOptions: QRCodeCanvasOptions = {style: {moduleSize: 2, quietZone: 1}};

describe('Vue QR code components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('renders SVG QR code output and forwards wrapper attributes', () => {
    const wrapper = mount(QRCodeSVG, {
      attrs: {class: 'qrcode'},
      props: {data: 'HELLO', options: svgOptions},
    });
    const svg = wrapper.get('svg');

    expect(wrapper.classes()).toContain('qrcode');
    expect(svg.attributes('width')).toBe('46');
    expect(svg.attributes('height')).toBe('46');
  });

  test('renders numeric input data', () => {
    const wrapper = mount(QRCodeSVG, {props: {data: 12_345, options: svgOptions}});

    expect(wrapper.findAll('svg path')).toHaveLength(2);
  });

  test('renders image QR code output with PNG data and accessibility attributes', () => {
    const wrapper = mount(QRCodeImage, {props: {data: 'HELLO', options: imageOptions}});
    const image = wrapper.get('img');

    expect(image.attributes('src')).toMatch(/^data:image\/png;base64,/);
    expect(image.element.width).toBe(46);
    expect(image.element.height).toBe(46);
    expect(image.attributes('alt')).toBe('QR alt');
    expect(image.attributes('aria-label')).toBe('QR aria');
    expect(image.attributes('title')).toBe('QR title');
  });

  test('downloads image and SVG QR code output', async () => {
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const svg = mount(QRCodeSVG, {props: {data: 'HELLO', options: svgOptions}});
    const image = mount(QRCodeImage, {props: {data: 'HELLO', options: imageOptions}});

    (svg.vm as unknown as QRCodeDownloadHandle).download('qrcodesdk');
    (image.vm as unknown as QRCodeDownloadHandle).download('qrcodesdk');

    expect(downloads).toEqual([
      {href: 'blob:qrcode-svg', filename: 'qrcodesdk.svg'},
      {href: expect.stringMatching(/^data:image\/png;base64,/), filename: 'qrcodesdk.png'},
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('renders canvas QR code output', () => {
    const wrapper = mount(QRCodeCanvas, {props: {data: 'HELLO', options: canvasOptions}});
    const canvas = wrapper.get('canvas').element;

    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('renders decorative defaults and labeled Canvas output', () => {
    const svg = mount(QRCodeSVG, {props: {data: 'DECORATIVE'}});
    const canvas = mount(QRCodeCanvas, {
      props: {data: 'LABELED', options: {accessibility: {title: 'Scan this code'}}},
    }).get('canvas');

    expect(svg.get('svg').attributes('aria-hidden')).toBe('true');
    expect(canvas.attributes('role')).toBe('img');
    expect(canvas.attributes('aria-label')).toBe('Scan this code');
  });

  test('passes styled options through SVG, image, and canvas components', () => {
    const styledOptions = {
      style: {
        moduleSize: 2,
        quietZone: 1,
        modules: {color: '#112233' as const, shape: 'diagonal-rounded' as const},
        finder: {
          outer: {color: '#445566' as const, shape: 'extra-rounded' as const},
          center: {color: '#778899' as const, shape: 'circle' as const},
        },
      },
    };
    const svg = mount(QRCodeSVG, {props: {data: 'STYLED', options: styledOptions}});
    const image = mount(QRCodeImage, {props: {data: 'STYLED', options: styledOptions}});
    const canvas = mount(QRCodeCanvas, {props: {data: 'STYLED', options: styledOptions}});

    expect(svg.findAll('svg path').map((path) => path.attributes('fill'))).toEqual([
      '#ffffff',
      '#112233',
      '#445566',
      '#778899',
    ]);
    expect(image.find('img').exists()).toBe(true);
    expect(canvas.find('canvas').exists()).toBe(true);
  });

  test('passes prepared image overlays through every component', () => {
    const source = document.createElement('canvas');
    source.width = 4;
    source.height = 2;
    const svgSource = 'data:image/png;base64,cHJlcGFyZWQ=' as const;
    const svg = mount(QRCodeSVG, {
      props: {data: 'OVERLAY', options: {...svgOptions, image: {source: svgSource, size: 0.2}}},
    });
    const image = mount(QRCodeImage, {
      props: {data: 'OVERLAY', options: {...imageOptions, image: {source, size: 0.2}}},
    });
    const canvas = mount(QRCodeCanvas, {
      props: {data: 'OVERLAY', options: {...canvasOptions, image: {source, size: 0.2}}},
    });

    expect(svg.get('svg image').attributes('href')).toBe(svgSource);
    expect(svg.find('svg rect').exists()).toBe(true);
    expect(image.find('img').exists()).toBe(true);
    expect(canvas.find('canvas').exists()).toBe(true);
  });

  test('replaces rendered image and canvas when props change', async () => {
    const image = mount(QRCodeImage, {props: {data: 'HELLO', options: imageOptions}});
    const canvas = mount(QRCodeCanvas, {props: {data: 'HELLO', options: canvasOptions}});
    const firstImage = image.get('img').element;
    const firstCanvas = canvas.get('canvas').element;

    await image.setProps({options: {style: {moduleSize: 3, quietZone: 1}}});
    await canvas.setProps({data: 'WORLD'});
    await nextTick();

    expect(image.findAll('img')).toHaveLength(1);
    expect(image.get('img').element).not.toBe(firstImage);
    expect(image.get('img').element.width).toBe(69);
    expect(canvas.findAll('canvas')).toHaveLength(1);
    expect(canvas.get('canvas').element).not.toBe(firstCanvas);
  });

  test('stops browser rendering after unmount', async () => {
    const data = ref('HELLO');
    const hostComponent = defineComponent({
      setup: () => () => h(QRCodeCanvas, {data: data.value, options: canvasOptions}),
    });
    const wrapper = mount(hostComponent);
    const host = wrapper.get('div').element;
    const replaceChildren = vi.spyOn(host, 'replaceChildren');

    wrapper.unmount();
    replaceChildren.mockClear();
    data.value = 'WORLD';
    await nextTick();

    expect(replaceChildren).not.toHaveBeenCalled();
  });

  test('renders SVG but no browser elements during SSR', async () => {
    const svg = await renderToString(
      createSSRApp({render: () => h(QRCodeSVG, {data: 'HELLO', options: svgOptions})}),
    );
    const image = await renderToString(
      createSSRApp({render: () => h(QRCodeImage, {data: 'HELLO', options: imageOptions})}),
    );
    const canvas = await renderToString(
      createSSRApp({render: () => h(QRCodeCanvas, {data: 'HELLO', options: canvasOptions})}),
    );

    expect(svg).toContain('<svg');
    expect(image).not.toContain('<img');
    expect(canvas).not.toContain('<canvas');
  });
});
