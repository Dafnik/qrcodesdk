import {Component} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {renderApplication} from '@angular/platform-server';

import {describe, expect, test} from 'vitest';

import {QRCodeCanvas} from './QRCodeCanvas';
import {QRCodeImage} from './QRCodeImage';
import {QRCodeSVG} from './QRCodeSVG';

@Component({
  selector: 'qrcode-ssr-host',
  imports: [QRCodeCanvas, QRCodeImage, QRCodeSVG],
  template: `
    <qrcode-svg data="SSR" />
    <qrcode-image data="SSR" />
    <qrcode-canvas data="SSR" />
  `,
})
class QRCodeSSRHost {}

describe('Angular QR code server rendering', () => {
  test('renders complete SVG markup and permanent browser-output hosts', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(QRCodeSSRHost, undefined, context),
      {
        document: '<qrcode-ssr-host></qrcode-ssr-host>',
        url: '/',
      },
    );

    expect(html).toContain('<qrcode-svg');
    expect(html).toContain('<svg');
    expect(html).toContain('<path');
    expect(html).toMatch(/<qrcode-image[^>]*><\/qrcode-image>/);
    expect(html).toMatch(/<qrcode-canvas[^>]*><\/qrcode-canvas>/);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<canvas');
  });
});
