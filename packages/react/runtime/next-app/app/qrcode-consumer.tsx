'use client';

import {version} from 'react';

import {
  QRCodeCanvas,
  QRCodeImage,
  QRCodeSVG,
  circle,
  finder,
  svgCenterImage,
} from '@qrcodesdk/react';

const options = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions = {
  ...options,
  accessibility: {
    alt: 'Framework runtime QR code',
    ariaLabel: 'Framework runtime QR code',
  },
};
const logo =
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')}` as const;

export function QRCodeConsumer() {
  return (
    <main>
      <p data-testid="framework-version">React {version}</p>
      <section data-testid="qrcode-svg">
        <QRCodeSVG payload="HELLO" options={options} />
      </section>
      <section data-testid="qrcode-image">
        <QRCodeImage payload="HELLO" options={imageOptions} />
      </section>
      <section data-testid="qrcode-canvas">
        <QRCodeCanvas payload="HELLO" options={options} />
      </section>
      <section data-testid="qrcode-styled-svg">
        <QRCodeSVG
          payload="STYLED"
          options={{
            style: {...options.style, finder: finder({center: circle(), color: '#ff0000'})},
            centerImage: svgCenterImage(logo, {size: 0.1}),
          }}
        />
      </section>
    </main>
  );
}
