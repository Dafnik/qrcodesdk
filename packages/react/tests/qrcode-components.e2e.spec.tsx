import {cleanup, render, waitFor} from '@testing-library/react';
import {captureDownloads, mockCanvasRendering} from '@repo/core-testing';
import {createRef} from 'react';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

import type {QRCodeCanvasOptions, QRCodePNGImageOptions} from '@qrcodesdk/browser';
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';
import {canvasCenterImage} from '@qrcodesdk/browser';
import {svgCenterImage} from '@qrcodesdk/core';

import {
  QRCodeCanvas,
  type QRCodeDownloadHandle,
  QRCodeGIF,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  QRCodeWebP,
} from '../src';

const svgOptions: QRCodeSVGOptions = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions: QRCodePNGImageOptions = {
  style: {moduleSize: 2, quietZone: 1},
  accessibility: {alt: 'QR alt', ariaLabel: 'QR aria', title: 'QR title'},
};
const canvasOptions: QRCodeCanvasOptions = {style: {moduleSize: 2, quietZone: 1}};

describe('React QR code components', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  afterEach(() => {
    cleanup();
  });

  test('renders SVG QR code output', () => {
    const {container} = render(<QRCodeSVG payload="HELLO" options={svgOptions} />);
    const svg = renderedElement<SVGSVGElement>(container, 'svg');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('46');
    expect(svg.getAttribute('height')).toBe('46');
  });

  test('renders numeric payload', () => {
    const {container} = render(<QRCodeSVG payload={12_345} options={svgOptions} />);
    const svg = renderedElement<SVGSVGElement>(container, 'svg');

    expect(svg.querySelectorAll('path')).toHaveLength(2);
  });

  test('renders image QR code output with PNG data and accessibility attributes', async () => {
    const {container} = render(<QRCodePNG payload="HELLO" options={imageOptions} />);

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
    const imageQRCode = createRef<QRCodeDownloadHandle>();
    const downloads = captureDownloads(vi);

    render(<QRCodePNG payload="HELLO" options={imageOptions} ref={imageQRCode} />);
    imageQRCode.current?.download('qrcodesdk');

    expect(downloads).toEqual([
      {
        href: expect.stringMatching(/^data:image\/png;base64,/),
        filename: 'qrcodesdk.png',
      },
    ]);
  });

  test.each([
    ['WebP', QRCodeWebP, 'webp', 'webp'],
    ['GIF', QRCodeGIF, 'gif', 'gif'],
    ['JPEG', QRCodeJPEG, 'jpeg', 'jpg'],
  ] as const)(
    'renders and downloads %s image output',
    async (_name, Component, type, extension) => {
      const imageQRCode = createRef<QRCodeDownloadHandle>();
      const downloads = captureDownloads(vi);
      const {container} = render(
        <Component payload="HELLO" options={imageOptions} ref={imageQRCode} />,
      );

      await waitFor(() => expect(container.querySelector('img')).not.toBeNull());

      const image = renderedElement<HTMLImageElement>(container, 'img');
      expect(image.src.startsWith(`data:image/${type};base64,`)).toBe(true);
      expect(image.width).toBe(46);
      expect(image.alt).toBe('QR alt');

      imageQRCode.current?.download('qrcodesdk');
      expect(downloads).toEqual([
        {
          href: expect.stringMatching(new RegExp(`^data:image/${type};base64,`)),
          filename: `qrcodesdk.${extension}`,
        },
      ]);
    },
  );

  test('passes matrix options and JPEG options to their renderers', async () => {
    const options = {matrix: {version: 2}, style: {moduleSize: 2, quietZone: 1}} as const;
    const {container} = render(
      <>
        <QRCodeJPEG payload="HELLO" options={{...options, quality: 10}} id="low" />
        <QRCodeJPEG
          payload="HELLO"
          options={{...options, quality: 100, transparency: {matte: '#112233'}}}
          id="high"
        />
      </>,
    );

    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2));

    const low = renderedElement<HTMLImageElement>(container, '#low img');
    const high = renderedElement<HTMLImageElement>(container, '#high img');
    expect(low.width).toBe(54);
    expect(high.width).toBe(54);
    expect(low.src).not.toBe(high.src);
  });

  test('downloads SVG QR code output as SVG', async () => {
    const svgQRCode = createRef<QRCodeDownloadHandle>();
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<QRCodeSVG payload="HELLO" options={svgOptions} ref={svgQRCode} />);
    // The SVG download revokes its object URL after a delay.
    vi.useFakeTimers({toFake: ['setTimeout']});
    svgQRCode.current?.download('qrcodesdk');

    expect(downloads).toEqual([
      {
        href: 'blob:qrcode-svg',
        filename: 'qrcodesdk.svg',
      },
    ]);
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('renders canvas QR code output', async () => {
    const {container} = render(<QRCodeCanvas payload="HELLO" options={canvasOptions} />);

    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());

    const canvas = renderedElement<HTMLCanvasElement>(container, 'canvas');

    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('renders decorative defaults and labeled Canvas output', async () => {
    const {container} = render(
      <>
        <QRCodeSVG payload="DECORATIVE" />
        <QRCodeCanvas payload="LABELED" options={{accessibility: {title: 'Scan this code'}}} />
      </>,
    );

    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());

    expect(renderedElement<SVGSVGElement>(container, 'svg').getAttribute('aria-hidden')).toBe(
      'true',
    );
    const canvas = renderedElement<HTMLCanvasElement>(container, 'canvas');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Scan this code');
  });

  test.each([
    ['svg', QRCodeSVG],
    ['PNG', QRCodePNG],
    ['WebP', QRCodeWebP],
    ['GIF', QRCodeGIF],
    ['JPEG', QRCodeJPEG],
    ['canvas', QRCodeCanvas],
  ] as const)('forwards ordinary div props for %s output', async (_name, Component) => {
    const onClick = vi.fn();
    const {container} = render(
      <Component
        payload="PROPS"
        id="qrcode-wrapper"
        className="custom-class"
        style={{color: 'red'}}
        title="Wrapper title"
        data-purpose="download"
        aria-label="QR wrapper"
        onClick={onClick}
      />,
    );
    const wrapper = renderedElement<HTMLDivElement>(container, '#qrcode-wrapper');

    await waitFor(() => expect(wrapper.children).toHaveLength(1));
    wrapper.click();

    expect(wrapper.className).toBe('custom-class');
    expect(wrapper.style.color).toBe('red');
    expect(wrapper.title).toBe('Wrapper title');
    expect(wrapper.dataset.purpose).toBe('download');
    expect(wrapper.getAttribute('aria-label')).toBe('QR wrapper');
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('passes styled options through SVG, image, and canvas components', async () => {
    const styledOptions = {
      style: {
        moduleSize: 2,
        quietZone: 1,
        foreground: '#112233' as const,
        modules: diagonal({radius: 1}),
        finder: finder({ring: rounded({radius: 1}), center: circle(), color: '#445566'}),
      },
    };
    const {container} = render(
      <>
        <QRCodeSVG payload="STYLED" options={styledOptions} />
        <QRCodePNG payload="STYLED" options={styledOptions} />
        <QRCodeCanvas payload="STYLED" options={styledOptions} />
      </>,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull();
      expect(container.querySelector('canvas')).not.toBeNull();
    });

    expect(
      Array.from(container.querySelectorAll('svg path')).map((path) => path.getAttribute('fill')),
    ).toEqual(['#ffffff', '#445566', '#112233']);
  });

  test('passes prepared center images through SVG, image, and canvas components', async () => {
    const source = document.createElement('canvas');
    source.width = 4;
    source.height = 2;
    const svgSource = 'data:image/png;base64,cHJlcGFyZWQ=' as const;
    const {container, rerender} = render(
      <>
        <QRCodeSVG
          payload="CENTER IMAGE"
          options={{...svgOptions, centerImage: svgCenterImage(svgSource, {size: 0.2})}}
        />
        <QRCodePNG
          payload="CENTER IMAGE"
          options={{...imageOptions, centerImage: canvasCenterImage(source, {size: 0.2})}}
        />
        <QRCodeCanvas
          payload="CENTER IMAGE"
          options={{...canvasOptions, centerImage: canvasCenterImage(source, {size: 0.2})}}
        />
      </>,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull();
      expect(container.querySelector('canvas')).not.toBeNull();
    });

    const embeddedImage = renderedElement<SVGImageElement>(container, 'svg image');
    const firstImage = renderedElement<HTMLImageElement>(container, 'img');
    const firstCanvas = renderedElement<HTMLCanvasElement>(container, 'div > canvas');

    expect(embeddedImage.getAttribute('href')).toBe(svgSource);
    expect(container.querySelector('svg mask')).toBeNull();

    rerender(
      <>
        <QRCodeSVG
          payload="CENTER IMAGE"
          options={{...svgOptions, centerImage: svgCenterImage(svgSource, {size: 0.3})}}
        />
        <QRCodePNG
          payload="CENTER IMAGE"
          options={{...imageOptions, centerImage: canvasCenterImage(source, {size: 0.3})}}
        />
        <QRCodeCanvas
          payload="CENTER IMAGE"
          options={{...canvasOptions, centerImage: canvasCenterImage(source, {size: 0.3})}}
        />
      </>,
    );

    await waitFor(() => {
      expect(renderedElement<HTMLImageElement>(container, 'img')).not.toBe(firstImage);
      expect(renderedElement<HTMLCanvasElement>(container, 'div > canvas')).not.toBe(firstCanvas);
    });
  });

  test('downloads prepared SVG and PNG center images', async () => {
    const source = document.createElement('canvas');
    source.width = 2;
    source.height = 1;
    const svgQRCode = createRef<QRCodeDownloadHandle>();
    const imageQRCode = createRef<QRCodeDownloadHandle>();
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-center-image-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(
      <>
        <QRCodeSVG
          ref={svgQRCode}
          payload="CENTER IMAGE"
          options={{
            ...svgOptions,
            centerImage: svgCenterImage('data:image/png;base64,cHJlcGFyZWQ='),
          }}
        />
        <QRCodePNG
          ref={imageQRCode}
          payload="CENTER IMAGE"
          options={{...imageOptions, centerImage: canvasCenterImage(source)}}
        />
      </>,
    );

    // The SVG download revokes its object URL after a delay.
    vi.useFakeTimers({toFake: ['setTimeout']});
    svgQRCode.current?.download('center-image');
    imageQRCode.current?.download('center-image');

    expect(downloads).toEqual([
      {href: 'blob:qrcode-center-image-svg', filename: 'center-image.svg'},
      {href: 'data:image/png;base64,qrcode', filename: 'center-image.png'},
    ]);

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('replaces existing rendered image when props change', async () => {
    const {container, rerender} = render(<QRCodePNG payload="HELLO" options={imageOptions} />);

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());

    const wrapper = renderedElement<HTMLDivElement>(container, 'div');
    const firstImage = renderedElement<HTMLImageElement>(container, 'img');

    rerender(<QRCodePNG payload="HELLO" options={{style: {moduleSize: 3, quietZone: 1}}} />);

    await waitFor(() =>
      expect(renderedElement<HTMLImageElement>(container, 'img')).not.toBe(firstImage),
    );

    const secondImage = renderedElement<HTMLImageElement>(container, 'img');

    expect(wrapper.children).toHaveLength(1);
    expect(secondImage.width).toBe(69);
    expect(secondImage.height).toBe(69);
  });

  test('replaces existing rendered canvas when props change', async () => {
    const {container, rerender} = render(<QRCodeCanvas payload="HELLO" options={canvasOptions} />);

    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());

    const wrapper = renderedElement<HTMLDivElement>(container, 'div');
    const firstCanvas = renderedElement<HTMLCanvasElement>(container, 'canvas');

    rerender(<QRCodeCanvas payload="WORLD" options={canvasOptions} />);

    await waitFor(() =>
      expect(renderedElement<HTMLCanvasElement>(container, 'canvas')).not.toBe(firstCanvas),
    );

    const secondCanvas = renderedElement<HTMLCanvasElement>(container, 'canvas');

    expect(wrapper.children).toHaveLength(1);
    expect(secondCanvas.width).toBe(46);
    expect(secondCanvas.height).toBe(46);
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
