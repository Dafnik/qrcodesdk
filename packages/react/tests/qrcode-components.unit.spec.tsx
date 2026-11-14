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

  test('enables Kanji mode through matrix options', () => {
    const markup = (matrix: reactApi.QRCodeMatrixOptions) =>
      renderToString(<reactApi.QRCodeSVG payload="東京タワー" options={{matrix}} />);

    expect(markup({kanji: reactApi.kanji})).toBe(markup({mode: 'kanji', kanji: reactApi.kanji}));
    expect(markup({kanji: reactApi.kanji})).not.toBe(markup({}));
  });

  test('re-exports the payload helpers', () => {
    const payload = reactApi.wifiPayload({ssid: 'Office', password: 'secret'});

    expect(payload).toBe('WIFI:T:WPA;S:Office;P:secret;;');
    expect(renderToString(<reactApi.QRCodeSVG payload={payload} />)).toContain('<svg');
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

  test('renders a Micro QR code through the matrix options', () => {
    const svg = renderToString(
      <QRCodeSVG payload="12345" options={{matrix: {symbol: reactApi.microQR()}}} />,
    );

    expect(svg).toContain('viewBox="0 0 17 17"');
  });

  test('renders an rMQR code through the matrix options', () => {
    const svg = renderToString(
      <QRCodeSVG payload="12345" options={{matrix: {symbol: reactApi.rMQR()}}} />,
    );

    expect(svg).toContain('viewBox="0 0 31 15"');
  });
});
