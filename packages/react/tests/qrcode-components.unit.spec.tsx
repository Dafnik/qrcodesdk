import {cleanup, render} from '@testing-library/react';
import {mockCanvasRendering} from '@repo/core-testing';
import {createRef} from 'react';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

import {QRCodeImage, QRCodeSVG, type QRCodeDownloadHandle} from '../src';

describe('React QR code component handles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCanvasRendering(vi);
  });

  afterEach(() => {
    cleanup();
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
});
