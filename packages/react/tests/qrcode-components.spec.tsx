import {cleanup, render, waitFor} from '@testing-library/react';
import {captureDownloads, mockCanvasRendering} from '@repo/core-testing';
import {createRef} from 'react';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

import {
  CanvasQRCode,
  ImageQRCode,
  type ImageQRCodeHandle,
  type QRCodeCanvasOptions,
  type QRCodeImageOptions,
  type QRCodeSVGOptions,
  SVGQRCode,
  type SVGQRCodeHandle,
} from '../src';

const svgOptions: QRCodeSVGOptions = {size: 2, margin: 1};
const imageOptions: QRCodeImageOptions = {
  size: 2,
  margin: 1,
  alt: 'QR alt',
  ariaLabel: 'QR aria',
  title: 'QR title',
};
const canvasOptions: QRCodeCanvasOptions = {size: 2, margin: 1};

describe('React QR code components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  afterEach(() => {
    cleanup();
  });

  test('renders SVG QR code output', () => {
    const {container} = render(<SVGQRCode data="HELLO" options={svgOptions} />);
    const svg = renderedElement<SVGSVGElement>(container, 'svg');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('46');
    expect(svg.getAttribute('height')).toBe('46');
  });

  test('renders image QR code output with PNG data and accessibility attributes', async () => {
    const {container} = render(<ImageQRCode data="HELLO" options={imageOptions} />);

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());

    const image = renderedElement<HTMLImageElement>(container, 'img');

    expect(image.src).toMatch(/^data:image\/png;base64,/);
    expect(image.width).toBe(46);
    expect(image.height).toBe(46);
    expect(image.alt).toBe('QR alt');
    expect(image.getAttribute('aria-label')).toBe('QR aria');
    expect(image.title).toBe('QR title');
  });

  test('downloads image QR code output as PNG', () => {
    const imageQRCode = createRef<ImageQRCodeHandle>();
    const downloads = captureDownloads(vi);

    render(<ImageQRCode data="HELLO" options={imageOptions} ref={imageQRCode} />);
    imageQRCode.current?.download('qrcodesdk');

    expect(downloads).toEqual([
      {
        href: expect.stringMatching(/^data:image\/png;base64,/),
        filename: 'qrcodesdk.png',
      },
    ]);
  });

  test('downloads SVG QR code output as SVG', () => {
    const svgQRCode = createRef<SVGQRCodeHandle>();
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<SVGQRCode data="HELLO" options={svgOptions} ref={svgQRCode} />);
    svgQRCode.current?.download('qrcodesdk');

    expect(downloads).toEqual([
      {
        href: 'blob:qrcode-svg',
        filename: 'qrcodesdk.svg',
      },
    ]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('renders canvas QR code output', async () => {
    const {container} = render(<CanvasQRCode data="HELLO" options={canvasOptions} />);

    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());

    const canvas = renderedElement<HTMLCanvasElement>(container, 'canvas');

    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('replaces existing rendered image when props change', async () => {
    const {container, rerender} = render(<ImageQRCode data="HELLO" options={imageOptions} />);

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());

    const wrapper = renderedElement<HTMLDivElement>(container, 'div');
    const firstImage = renderedElement<HTMLImageElement>(container, 'img');

    rerender(<ImageQRCode data="HELLO" options={{size: 3, margin: 1}} />);

    await waitFor(() =>
      expect(renderedElement<HTMLImageElement>(container, 'img')).not.toBe(firstImage),
    );

    const secondImage = renderedElement<HTMLImageElement>(container, 'img');

    expect(wrapper.children).toHaveLength(1);
    expect(secondImage.width).toBe(69);
    expect(secondImage.height).toBe(69);
  });

  test('replaces existing rendered canvas when props change', async () => {
    const {container, rerender} = render(<CanvasQRCode data="HELLO" options={canvasOptions} />);

    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());

    const wrapper = renderedElement<HTMLDivElement>(container, 'div');
    const firstCanvas = renderedElement<HTMLCanvasElement>(container, 'canvas');

    rerender(<CanvasQRCode data="WORLD" options={canvasOptions} />);

    await waitFor(() =>
      expect(renderedElement<HTMLCanvasElement>(container, 'canvas')).not.toBe(firstCanvas),
    );

    const secondCanvas = renderedElement<HTMLCanvasElement>(container, 'canvas');

    expect(wrapper.children).toHaveLength(1);
    expect(secondCanvas.width).toBe(46);
    expect(secondCanvas.height).toBe(46);
  });

  test('exposes download handles only for SVG and image components', () => {
    const svgQRCode = createRef<SVGQRCodeHandle>();
    const imageQRCode = createRef<ImageQRCodeHandle>();

    render(
      <>
        <SVGQRCode data="HELLO" ref={svgQRCode} />
        <ImageQRCode data="HELLO" ref={imageQRCode} />
      </>,
    );

    expect(svgQRCode.current).toEqual({download: expect.any(Function)});
    expect(imageQRCode.current).toEqual({download: expect.any(Function)});
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
