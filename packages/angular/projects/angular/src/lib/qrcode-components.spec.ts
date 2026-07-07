import {Component, ViewChild, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {beforeEach, describe, expect, test, vi} from 'vitest';

import {CanvasQRCode, type QRCodeCanvasOptions} from './CanvasQRCode';
import {ImageQRCode, type QRCodeImageOptions} from './ImageQRCode';
import {type QRCodeSVGOptions, SVGQRCode} from './SVGQRCode';

@Component({
  selector: 'svg-qrcode-host',
  imports: [SVGQRCode],
  template: '<svg-qrcode [data]="data()" [options]="options()" />',
})
class SVGQRCodeHost {
  data = signal('HELLO');
  options = signal<QRCodeSVGOptions>({size: 2, margin: 1});
}

@Component({
  selector: 'image-qrcode-host',
  imports: [ImageQRCode],
  template: '<image-qrcode [data]="data()" [options]="options()" />',
})
class ImageQRCodeHost {
  data = signal('HELLO');
  options = signal<QRCodeImageOptions>({
    size: 2,
    margin: 1,
    alt: 'QR alt',
    ariaLabel: 'QR aria',
    title: 'QR title',
  });

  @ViewChild(ImageQRCode) imageQRCode!: ImageQRCode;
}

@Component({
  selector: 'canvas-qrcode-host',
  imports: [CanvasQRCode],
  template: '<canvas-qrcode [data]="data()" [options]="options()" />',
})
class CanvasQRCodeHost {
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
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((contextId: string) => {
      if (contextId !== '2d') return null;

      return {
        fillStyle: '#000000',
        fillRect: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    }) as HTMLCanvasElement['getContext']);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,qrcode',
    );
  });

  test('renders SVG QR code output', () => {
    const fixture = TestBed.createComponent(SVGQRCodeHost);

    fixture.detectChanges();

    const svg = renderedElement<SVGSVGElement>(fixture, 'svg');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('46');
    expect(svg.getAttribute('height')).toBe('46');
  });

  test('renders image QR code output with PNG data and accessibility attributes', () => {
    const fixture = TestBed.createComponent(ImageQRCodeHost);

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
    const fixture = TestBed.createComponent(ImageQRCodeHost);
    const createElement = document.createElement.bind(document);
    let anchor: HTMLAnchorElement | undefined;

    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = createElement(tagName, options);

      if (tagName.toLowerCase() === 'a') {
        anchor = element as HTMLAnchorElement;
      }

      return element;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    fixture.detectChanges();
    fixture.componentInstance.imageQRCode.download('qrcodesdk');

    expect(anchor?.href).toMatch(/^data:image\/png;base64,/);
    expect(anchor?.download).toBe('qrcodesdk.png');
    expect(click).toHaveBeenCalledOnce();
  });

  test('renders canvas QR code output', () => {
    const fixture = TestBed.createComponent(CanvasQRCodeHost);

    fixture.detectChanges();

    const canvas = renderedElement<HTMLCanvasElement>(fixture, 'canvas');

    expect(canvas.width).toBe(46);
    expect(canvas.height).toBe(46);
  });

  test('replaces existing rendered image when inputs change', () => {
    const fixture = TestBed.createComponent(ImageQRCodeHost);

    fixture.detectChanges();

    const wrapper = renderedElement<HTMLElement>(fixture, 'image-qrcode');
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
    const fixture = TestBed.createComponent(CanvasQRCodeHost);

    fixture.detectChanges();

    const wrapper = renderedElement<HTMLElement>(fixture, 'canvas-qrcode');
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
