import {Component} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {renderApplication} from '@angular/platform-server';

import {describe, expect, test} from 'vitest';

import {QRCodeCanvas} from './QRCodeCanvas';
import {QRCodeJPEG} from './QRCodeJPEG';
import {QRCodePNG} from './QRCodePNG';
import {QRCodeSVG} from './QRCodeSVG';

@Component({
  selector: 'qrcode-ssr-host',
  imports: [QRCodeCanvas, QRCodeJPEG, QRCodePNG, QRCodeSVG],
  template: `
    <qrcode-svg payload="SSR" />
    <qrcode-png payload="SSR" />
    <qrcode-jpeg payload="SSR" />
    <qrcode-canvas payload="SSR" />
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
    expect(html).toMatch(/<qrcode-png[^>]*><\/qrcode-png>/);
    expect(html).toMatch(/<qrcode-jpeg[^>]*><\/qrcode-jpeg>/);
    expect(html).toMatch(/<qrcode-canvas[^>]*><\/qrcode-canvas>/);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<canvas');
  });
});
