'use client';

import {version} from 'react';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

const options = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions = {
  ...options,
  accessibility: {
    alt: 'Framework runtime QR code',
    ariaLabel: 'Framework runtime QR code',
  },
};

export function QRCodeConsumer() {
  return (
    <main>
      <p data-testid="framework-version">React {version}</p>
      <section data-testid="qrcode-svg">
        <QRCodeSVG data="HELLO" options={options} />
      </section>
      <section data-testid="qrcode-image">
        <QRCodeImage data="HELLO" options={imageOptions} />
      </section>
      <section data-testid="qrcode-canvas">
        <QRCodeCanvas data="HELLO" options={options} />
      </section>
    </main>
  );
}
