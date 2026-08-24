import {cleanup, render} from '@testing-library/react';
import {mockCanvasRendering} from '@repo/core-testing';
import {createRef} from 'react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

import * as reactApi from '../src';

type QRCodeDownloadHandle = import('../src').QRCodeDownloadHandle;

const {QRCodeCanvas, QRCodeImage, QRCodeSVG} = reactApi;

describe('React QR code component handles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  afterEach(() => {
    cleanup();
  });

  test('exports only the documented runtime components', () => {
    expect(Object.keys(reactApi).sort()).toEqual(['QRCodeCanvas', 'QRCodeImage', 'QRCodeSVG']);
  });

  test('exposes download handles only for SVG and image components', () => {
    const svgQRCode = createRef<QRCodeDownloadHandle>();
    const imageQRCode = createRef<QRCodeDownloadHandle>();

    render(
      <>
        <QRCodeSVG data="HELLO" ref={svgQRCode} />
        <QRCodeImage data="HELLO" ref={imageQRCode} />
      </>,
    );

    expect(svgQRCode.current).toEqual({download: expect.any(Function)});
    expect(imageQRCode.current).toEqual({download: expect.any(Function)});
  });

  test('server-renders complete SVG markup and permanent browser-output wrappers', () => {
    const svg = renderToString(<QRCodeSVG data="SSR" />);
    const image = renderToString(<QRCodeImage data="SSR" />);
    const canvas = renderToString(<QRCodeCanvas data="SSR" />);

    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(image).toMatch(/^<div><\/div>$/);
    expect(canvas).toMatch(/^<div><\/div>$/);
  });
});
