import {StrictMode, version} from 'react';
import {createRoot} from 'react-dom/client';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

const options = {size: 2, margin: 1};
const imageOptions = {
  ...options,
  alt: 'Framework runtime QR code',
  ariaLabel: 'Framework runtime QR code',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
);
