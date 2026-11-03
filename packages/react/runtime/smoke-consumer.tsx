import {StrictMode, version} from 'react';
import {createRoot} from 'react-dom/client';

import {QRCodeCanvas, QRCodeJPEG, QRCodePNG, QRCodeSVG} from '@qrcodesdk/react';

const options = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions = {
  ...options,
  accessibility: {
    alt: 'Framework runtime QR code',
    ariaLabel: 'Framework runtime QR code',
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <p data-testid="framework-version">React {version}</p>
      <section data-testid="qrcode-svg">
        <QRCodeSVG payload="HELLO" options={options} />
      </section>
      <section data-testid="qrcode-image">
        <QRCodePNG payload="HELLO" options={imageOptions} />
      </section>
      <section data-testid="qrcode-jpeg">
        <QRCodeJPEG payload="HELLO" options={imageOptions} />
      </section>
      <section data-testid="qrcode-canvas">
        <QRCodeCanvas payload="HELLO" options={options} />
      </section>
    </main>
  </StrictMode>,
);
