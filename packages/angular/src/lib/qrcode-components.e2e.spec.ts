import {Component, input, viewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {captureDownloads, mockCanvasRendering} from '@repo/core-testing';
import {beforeEach, describe, expect, test, vi} from 'vitest';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeInputData, QRCodeSVGOptions} from '@qrcodesdk/core';

import {QRCodeCanvas} from './QRCodeCanvas';
import {QRCodeImage} from './QRCodeImage';
import {QRCodeSVG} from './QRCodeSVG';

@Component({
  selector: 'qrcode-svg-host',
  imports: [QRCodeSVG],
  template: '<qrcode-svg [data]="data()" [options]="options()" />',
})
class QRCodeSVGHost {
  readonly data = input<QRCodeInputData>('HELLO');
  readonly options = input<QRCodeSVGOptions>({size: 2, margin: 1});

  readonly svgQRCode = viewChild.required(QRCodeSVG);
}

@Component({
  selector: 'qrcode-image-host',
  imports: [QRCodeImage],
  template: '<qrcode-image [data]="data()" [options]="options()" />',
})
class QRCodeImageHost {
  readonly data = input<QRCodeInputData>('HELLO');
  readonly options = input<QRCodeImageOptions>({
    size: 2,
    margin: 1,
    alt: 'QR alt',
    ariaLabel: 'QR aria',
    title: 'QR title',
  });

  readonly imageQRCode = viewChild.required(QRCodeImage);
}

@Component({
  selector: 'qrcode-canvas-host',
  imports: [QRCodeCanvas],
  template: '<qrcode-canvas [data]="data()" [options]="options()" />',
})
class QRCodeCanvasHost {
  readonly data = input<QRCodeInputData>('HELLO');
  readonly options = input<QRCodeCanvasOptions>({size: 2, margin: 1});
}

function getRenderedElement<TElement extends Element>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): TElement {
  const element = fixture.nativeElement.querySelector(selector);

  if (!element) {
    throw new Error(`Expected ${selector} to be rendered`);
  }

  return element;
}

describe('Angular QR code components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
    mockCanvasRendering(vi);
  });

  test('renders SVG QR code output', () => {
    const fixture = TestBed.createComponent(QRCodeSVGHost);

    fixture.detectChanges();

    const svg = getRenderedElement<SVGSVGElement>(fixture, 'svg');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('46');
    expect(svg.getAttribute('height')).toBe('46');
  });

  test('renders numeric input data', async () => {
    const fixture = TestBed.createComponent(QRCodeSVGHost);

    fixture.componentRef.setInput('data', 12_345);
    await fixture.whenStable();

    const svg = getRenderedElement<SVGSVGElement>(fixture, 'svg');

    expect(svg.querySelectorAll('path')).toHaveLength(2);
  });

  test('renders image QR code output with PNG data and accessibility attributes', () => {
    const fixture = TestBed.createComponent(QRCodeImageHost);

    fixture.detectChanges();

    const image = getRenderedElement<HTMLImageElement>(fixture, 'img');

    expect(image.src).toMatch(/^data:image\/png;base64,/);
    expect(image.width).toBe(46);
    expect(image.height).toBe(46);
    expect(image.alt).toBe('QR alt');
    expect(image.getAttribute('aria-label')).toBe('QR aria');
    expect(image.title).toBe('QR title');
  });

  test('downloads image QR code output as PNG', () => {
    const fixture = TestBed.createComponent(QRCodeImageHost);
    const downloads = captureDownloads(vi);

    fixture.detectChanges();
    fixture.componentInstance.imageQRCode().download('qrcodesdk');

    expect(downloads).toEqual([
      {
        href: expect.stringMatching(/^data:image\/png;base64,/),
        filename: 'qrcodesdk.png',
      },
    ]);
  });

  test('downloads SVG QR code output as SVG', () => {
    const fixture = TestBed.createComponent(QRCodeSVGHost);
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    fixture.detectChanges();
    fixture.componentInstance.svgQRCode().download('qrcodesdk');

    expect(downloads).toEqual([
      {
        href: 'blob:qrcode-svg',
        filename: 'qrcodesdk.svg',
      },
    ]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('renders canvas QR code output', () => {
    const fixture = TestBed.createComponent(QRCodeCanvasHost);

    fixture.detectChanges();

    const canvas = getRenderedElement<HTMLCanvasElement>(fixture, 'canvas');

    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('passes styled options through SVG, image, and canvas components', () => {
    const styledOptions = {
      size: 3,
      margin: 2,
      dotsOptions: {color: '#112233' as const, type: 'classy-rounded' as const},
      cornersSquareOptions: {color: '#445566' as const, type: 'extra-rounded' as const},
      cornersDotOptions: {color: '#778899' as const, type: 'dot' as const},
    };
    const svgFixture = TestBed.createComponent(QRCodeSVGHost);
    const imageFixture = TestBed.createComponent(QRCodeImageHost);
    const canvasFixture = TestBed.createComponent(QRCodeCanvasHost);

    svgFixture.componentRef.setInput('options', styledOptions);
    imageFixture.componentRef.setInput('options', styledOptions);
    canvasFixture.componentRef.setInput('options', styledOptions);
    svgFixture.detectChanges();
    imageFixture.detectChanges();
    canvasFixture.detectChanges();

    const svg = getRenderedElement<SVGSVGElement>(svgFixture, 'svg');

    expect(
      Array.from(svg.querySelectorAll('path')).map((path) => path.getAttribute('fill')),
    ).toEqual(['#ffffff', '#112233', '#445566', '#778899']);
    expect(svg.getAttribute('width')).toBe('75');
    expect(svg.getAttribute('height')).toBe('75');

    const image = getRenderedElement<HTMLImageElement>(imageFixture, 'img');

    expect(image.src).toMatch(/^data:image\/png;base64,/);
    expect(image.width).toBe(75);
    expect(image.height).toBe(75);

    const canvas = getRenderedElement<HTMLCanvasElement>(canvasFixture, 'canvas');

    expect(canvas.width).toBe(75);
    expect(canvas.height).toBe(75);
  });

  test('passes prepared image overlays through SVG, image, and canvas components', async () => {
    const source = document.createElement('canvas');
    source.width = 4;
    source.height = 2;
    const svgFixture = TestBed.createComponent(QRCodeSVGHost);
    const imageFixture = TestBed.createComponent(QRCodeImageHost);
    const canvasFixture = TestBed.createComponent(QRCodeCanvasHost);

    svgFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source: 'data:image/png;base64,cHJlcGFyZWQ=', size: 0.2},
    });
    imageFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source, size: 0.2},
    });
    canvasFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source, size: 0.2},
    });
    await Promise.all([
      svgFixture.whenStable(),
      imageFixture.whenStable(),
      canvasFixture.whenStable(),
    ]);

    const embeddedImage = getRenderedElement<SVGImageElement>(svgFixture, 'svg image');
    const firstImage = getRenderedElement<HTMLImageElement>(imageFixture, 'img');
    const firstCanvas = getRenderedElement<HTMLCanvasElement>(canvasFixture, 'canvas');

    expect(embeddedImage.getAttribute('href')).toBe('data:image/png;base64,cHJlcGFyZWQ=');
    expect(svgFixture.nativeElement.querySelector('svg rect')).not.toBeNull();

    imageFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source, size: 0.3},
    });
    canvasFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source, size: 0.3},
    });
    await Promise.all([imageFixture.whenStable(), canvasFixture.whenStable()]);

    expect(getRenderedElement<HTMLImageElement>(imageFixture, 'img')).not.toBe(firstImage);
    expect(getRenderedElement<HTMLCanvasElement>(canvasFixture, 'canvas')).not.toBe(firstCanvas);
  });

  test('downloads prepared SVG and PNG image overlays', async () => {
    const source = document.createElement('canvas');
    source.width = 2;
    source.height = 1;
    const svgFixture = TestBed.createComponent(QRCodeSVGHost);
    const imageFixture = TestBed.createComponent(QRCodeImageHost);
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-overlay-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    svgFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source: 'data:image/png;base64,cHJlcGFyZWQ='},
    });
    imageFixture.componentRef.setInput('options', {
      size: 2,
      margin: 1,
      image: {source},
    });
    await Promise.all([svgFixture.whenStable(), imageFixture.whenStable()]);

    svgFixture.componentInstance.svgQRCode().download('overlay');
    imageFixture.componentInstance.imageQRCode().download('overlay');

    expect(downloads).toEqual([
      {href: 'blob:qrcode-overlay-svg', filename: 'overlay.svg'},
      {href: 'data:image/png;base64,qrcode', filename: 'overlay.png'},
    ]);
  });

  test('replaces existing rendered image when inputs change', () => {
    const fixture = TestBed.createComponent(QRCodeImageHost);

    fixture.detectChanges();

    const wrapper = getRenderedElement<HTMLElement>(fixture, 'qrcode-image');
    const firstImage = getRenderedElement<HTMLImageElement>(fixture, 'img');

    fixture.componentRef.setInput('options', {size: 3, margin: 1});
    fixture.detectChanges();

    const secondImage = getRenderedElement<HTMLImageElement>(fixture, 'img');

    expect(wrapper.children).toHaveLength(1);
    expect(secondImage).not.toBe(firstImage);
    expect(secondImage.width).toBe(69);
    expect(secondImage.height).toBe(69);
  });

  test('replaces existing rendered canvas when inputs change', () => {
    const fixture = TestBed.createComponent(QRCodeCanvasHost);

    fixture.detectChanges();

    const wrapper = getRenderedElement<HTMLElement>(fixture, 'qrcode-canvas');
    const firstCanvas = getRenderedElement<HTMLCanvasElement>(fixture, 'canvas');

    fixture.componentRef.setInput('data', 'WORLD');
    fixture.detectChanges();

    const secondCanvas = getRenderedElement<HTMLCanvasElement>(fixture, 'canvas');

    expect(wrapper.children).toHaveLength(1);
    expect(secondCanvas).not.toBe(firstCanvas);
    expect(secondCanvas.width).toBe(46);
    expect(secondCanvas.height).toBe(46);
  });
});
