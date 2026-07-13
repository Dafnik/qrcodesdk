import {Component, ViewChild, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {captureDownloads, mockCanvasRendering} from '@repo/core-testing';
import {beforeEach, describe, expect, test, vi} from 'vitest';

import {QRCodeCanvas, type QRCodeCanvasOptions} from './QRCodeCanvas';
import {QRCodeImage, type QRCodeImageOptions} from './QRCodeImage';
import {QRCodeSVG, type QRCodeSVGOptions} from './QRCodeSVG';

@Component({
  selector: 'qrcode-svg-host',
  imports: [QRCodeSVG],
  template: '<qrcode-svg [data]="data()" [options]="options()" />',
})
class QRCodeSVGHost {
  data = signal('HELLO');
  options = signal<QRCodeSVGOptions>({size: 2, margin: 1});

  @ViewChild(QRCodeSVG) svgQRCode!: QRCodeSVG;
}

@Component({
  selector: 'qrcode-image-host',
  imports: [QRCodeImage],
  template: '<qrcode-image [data]="data()" [options]="options()" />',
})
class QRCodeImageHost {
  data = signal('HELLO');
  options = signal<QRCodeImageOptions>({
    size: 2,
    margin: 1,
    alt: 'QR alt',
    ariaLabel: 'QR aria',
    title: 'QR title',
  });

  @ViewChild(QRCodeImage) imageQRCode!: QRCodeImage;
}

@Component({
  selector: 'qrcode-canvas-host',
  imports: [QRCodeCanvas],
  template: '<qrcode-canvas [data]="data()" [options]="options()" />',
})
class QRCodeCanvasHost {
  data = signal('HELLO');
  options = signal<QRCodeCanvasOptions>({size: 2, margin: 1});
}

function renderedElement<TElement extends Element>(
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

    const svg = renderedElement<SVGSVGElement>(fixture, 'svg');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('46');
    expect(svg.getAttribute('height')).toBe('46');
  });

  test('renders image QR code output with PNG data and accessibility attributes', () => {
    const fixture = TestBed.createComponent(QRCodeImageHost);

    fixture.detectChanges();

    const image = renderedElement<HTMLImageElement>(fixture, 'img');

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
    fixture.componentInstance.imageQRCode.download('qrcodesdk');

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
    fixture.componentInstance.svgQRCode.download('qrcodesdk');

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

    const canvas = renderedElement<HTMLCanvasElement>(fixture, 'canvas');

    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('replaces existing rendered image when inputs change', () => {
    const fixture = TestBed.createComponent(QRCodeImageHost);

    fixture.detectChanges();

    const wrapper = renderedElement<HTMLElement>(fixture, 'qrcode-image');
    const firstImage = renderedElement<HTMLImageElement>(fixture, 'img');

    fixture.componentInstance.options.set({size: 3, margin: 1});
    fixture.detectChanges();

    const secondImage = renderedElement<HTMLImageElement>(fixture, 'img');

    expect(wrapper.children).toHaveLength(1);
    expect(secondImage).not.toBe(firstImage);
    expect(secondImage.width).toBe(69);
    expect(secondImage.height).toBe(69);
  });

  test('replaces existing rendered canvas when inputs change', () => {
    const fixture = TestBed.createComponent(QRCodeCanvasHost);

    fixture.detectChanges();

    const wrapper = renderedElement<HTMLElement>(fixture, 'qrcode-canvas');
    const firstCanvas = renderedElement<HTMLCanvasElement>(fixture, 'canvas');

    fixture.componentInstance.data.set('WORLD');
    fixture.detectChanges();

    const secondCanvas = renderedElement<HTMLCanvasElement>(fixture, 'canvas');

    expect(wrapper.children).toHaveLength(1);
    expect(secondCanvas).not.toBe(firstCanvas);
    expect(secondCanvas.width).toBe(46);
    expect(secondCanvas.height).toBe(46);
  });
});
