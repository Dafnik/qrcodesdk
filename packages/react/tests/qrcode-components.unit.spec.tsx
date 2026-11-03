import {cleanup, render} from '@testing-library/react';
import {mockCanvasRendering} from '@repo/core-testing';
import {createRef} from 'react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, expectTypeOf, test, vi} from 'vitest';

import * as reactApi from '../src';

type QRCodeDownloadHandle = import('../src').QRCodeDownloadHandle;
type QRCodeSVGProps = import('../src/QRCodeSVG').QRCodeSVGProps;

const {QRCodeCanvas, QRCodePNG, QRCodeSVG} = reactApi;

describe('React QR code component handles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  afterEach(() => {
    cleanup();
  });

  test('exports the components, shapes, and center-image factories', () => {
    // An exact list keeps internal helpers out of the package root.
    expect(Object.keys(reactApi).sort()).toEqual([
      'QRCodeCanvas',
      'QRCodeGIF',
      'QRCodeJPEG',
      'QRCodePNG',
      'QRCodeSVG',
      'QRCodeWebP',
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

  test('accepts payload and options props', () => {
    expectTypeOf<QRCodeSVGProps>().toHaveProperty('payload');
    expectTypeOf<QRCodeSVGProps>().toHaveProperty('options');
  });

  test('exposes SVG and image download handles', () => {
    const svgQRCode = createRef<QRCodeDownloadHandle>();
    const imageQRCode = createRef<QRCodeDownloadHandle>();

    render(
      <>
        <QRCodeSVG payload="HELLO" ref={svgQRCode} />
        <QRCodePNG payload="HELLO" ref={imageQRCode} />
      </>,
    );

    expect(svgQRCode.current).toMatchObject({download: expect.any(Function)});
    expect(imageQRCode.current).toMatchObject({download: expect.any(Function)});
  });

  test('server-renders complete SVG markup and permanent browser-output wrappers', () => {
    const svg = renderToString(<QRCodeSVG payload="SSR" />);
    const image = renderToString(<QRCodePNG payload="SSR" />);
    const canvas = renderToString(<QRCodeCanvas payload="SSR" />);

    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(image).toMatch(/^<div><\/div>$/);
    expect(canvas).toMatch(/^<div><\/div>$/);
  });
});
