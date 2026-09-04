import {captureDownloads, mockCanvasRendering} from '@repo/core-testing';
import {render as renderComponent, waitFor} from '@testing-library/svelte';
import {beforeEach, describe, expect, test, vi} from 'vitest';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '../src/lib/index.js';

const svgOptions: QRCodeSVGOptions = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions: QRCodeImageOptions = {
  style: {moduleSize: 2, quietZone: 1},
  accessibility: {alt: 'QR alt', ariaLabel: 'QR aria', title: 'QR title'},
};
const canvasOptions: QRCodeCanvasOptions = {style: {moduleSize: 2, quietZone: 1}};

describe('Svelte QR code components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  test('renders SVG QR code output and forwards wrapper attributes', () => {
    const {container} = renderComponent(QRCodeSVG, {
      data: 'HELLO',
      options: svgOptions,
      class: 'qrcode',
      'data-wrapper': 'svg',
    });
    const wrapper = renderedElement<HTMLDivElement>(container, 'div');
    const svg = renderedElement<SVGSVGElement>(container, 'svg');

    expect(wrapper.classList).toContain('qrcode');
    expect(wrapper.dataset['wrapper']).toBe('svg');
    expect(svg.getAttribute('width')).toBe('46');
    expect(svg.getAttribute('height')).toBe('46');
  });

  test('renders numeric input data', () => {
    const {container} = renderComponent(QRCodeSVG, {data: 12_345, options: svgOptions});

    expect(container.querySelectorAll('svg path')).toHaveLength(2);
  });

  test('renders image QR code output with PNG data and accessibility attributes', async () => {
    const {container} = renderComponent(QRCodeImage, {data: 'HELLO', options: imageOptions});

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());

    const image = renderedElement<HTMLImageElement>(container, 'img');
    expect(image.src).toMatch(/^data:image\/png;base64,/);
    expect(image.width).toBe(46);
    expect(image.height).toBe(46);
    expect(image.alt).toBe('QR alt');
    expect(image.getAttribute('aria-label')).toBe('QR aria');
    expect(image.title).toBe('QR title');
  });

  test('downloads image and SVG QR code output', async () => {
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const svg = renderComponent(QRCodeSVG, {data: 'HELLO', options: svgOptions});
    const image = renderComponent(QRCodeImage, {data: 'HELLO', options: imageOptions});

    svg.component.download('qrcodesdk');
    image.component.download('qrcodesdk');

    expect(downloads).toEqual([
      {href: 'blob:qrcode-svg', filename: 'qrcodesdk.svg'},
      {href: expect.stringMatching(/^data:image\/png;base64,/), filename: 'qrcodesdk.png'},
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('renders canvas QR code output', async () => {
    const {container} = renderComponent(QRCodeCanvas, {data: 'HELLO', options: canvasOptions});

    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());
    const canvas = renderedElement<HTMLCanvasElement>(container, 'canvas');
    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('renders decorative defaults and labeled Canvas output', async () => {
    const svg = renderComponent(QRCodeSVG, {data: 'DECORATIVE'});
    const canvas = renderComponent(QRCodeCanvas, {
      data: 'LABELED',
      options: {accessibility: {title: 'Scan this code'}},
    });

    await waitFor(() => expect(canvas.container.querySelector('canvas')).not.toBeNull());

    expect(renderedElement<SVGSVGElement>(svg.container, 'svg').getAttribute('aria-hidden')).toBe(
      'true',
    );
    const canvasElement = renderedElement<HTMLCanvasElement>(canvas.container, 'canvas');
    expect(canvasElement.getAttribute('role')).toBe('img');
    expect(canvasElement.getAttribute('aria-label')).toBe('Scan this code');
  });

  test('passes styled options through SVG, image, and canvas components', async () => {
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
    const svg = renderComponent(QRCodeSVG, {data: 'STYLED', options: styledOptions});
    const image = renderComponent(QRCodeImage, {data: 'STYLED', options: styledOptions});
    const canvas = renderComponent(QRCodeCanvas, {data: 'STYLED', options: styledOptions});

    await waitFor(() => {
      expect(image.container.querySelector('img')).not.toBeNull();
      expect(canvas.container.querySelector('canvas')).not.toBeNull();
    });

    expect(
      Array.from(svg.container.querySelectorAll('svg path')).map((path) =>
        path.getAttribute('fill'),
      ),
    ).toEqual(['#ffffff', '#112233', '#445566', '#778899']);
  });

  test('passes prepared image overlays through every component', async () => {
    const source = document.createElement('canvas');
    source.width = 4;
    source.height = 2;
    const svgSource = 'data:image/png;base64,cHJlcGFyZWQ=' as const;
    const svg = renderComponent(QRCodeSVG, {
      data: 'OVERLAY',
      options: {...svgOptions, image: {source: svgSource, size: 0.2}},
    });
    const image = renderComponent(QRCodeImage, {
      data: 'OVERLAY',
      options: {...imageOptions, image: {source, size: 0.2}},
    });
    const canvas = renderComponent(QRCodeCanvas, {
      data: 'OVERLAY',
      options: {...canvasOptions, image: {source, size: 0.2}},
    });

    await waitFor(() => {
      expect(image.container.querySelector('img')).not.toBeNull();
      expect(canvas.container.querySelector('canvas')).not.toBeNull();
    });

    expect(renderedElement<SVGImageElement>(svg.container, 'svg image').getAttribute('href')).toBe(
      svgSource,
    );
    expect(svg.container.querySelector('svg rect')).not.toBeNull();
  });

  test('replaces rendered image and canvas when props change', async () => {
    const image = renderComponent(QRCodeImage, {data: 'HELLO', options: imageOptions});
    const canvas = renderComponent(QRCodeCanvas, {data: 'HELLO', options: canvasOptions});

    await waitFor(() => {
      expect(image.container.querySelector('img')).not.toBeNull();
      expect(canvas.container.querySelector('canvas')).not.toBeNull();
    });

    const imageWrapper = renderedElement<HTMLDivElement>(image.container, 'div');
    const canvasWrapper = renderedElement<HTMLDivElement>(canvas.container, 'div');
    const firstImage = renderedElement<HTMLImageElement>(image.container, 'img');
    const firstCanvas = renderedElement<HTMLCanvasElement>(canvas.container, 'canvas');

    await image.rerender({options: {style: {moduleSize: 3, quietZone: 1}}});
    await canvas.rerender({data: 'WORLD'});

    expect(imageWrapper.children).toHaveLength(1);
    expect(renderedElement<HTMLImageElement>(image.container, 'img')).not.toBe(firstImage);
    expect(renderedElement<HTMLImageElement>(image.container, 'img').width).toBe(69);
    expect(canvasWrapper.children).toHaveLength(1);
    expect(renderedElement<HTMLCanvasElement>(canvas.container, 'canvas')).not.toBe(firstCanvas);
  });

  test('destroys browser effects when unmounted', async () => {
    const rendered = renderComponent(QRCodeCanvas, {data: 'HELLO', options: canvasOptions});
    const wrapper = renderedElement<HTMLDivElement>(rendered.container, 'div');
    const replaceChildren = vi.spyOn(wrapper, 'replaceChildren');

    rendered.unmount();
    replaceChildren.mockClear();
    await Promise.resolve();

    expect(replaceChildren).not.toHaveBeenCalled();
  });
});

function renderedElement<TElement extends Element>(
  container: HTMLElement,
  selector: string,
): TElement {
  const element = container.querySelector(selector);

  if (!element) {
    throw new Error(`Expected ${selector} to be rendered`);
  }

  return element as TElement;
}
