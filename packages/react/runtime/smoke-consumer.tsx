import {StrictMode, version} from 'react';
import {createRoot} from 'react-dom/client';

import {QRCodeCanvas, QRCodeJPEG, QRCodePNG, QRCodeSVG, kanji} from '@qrcodesdk/react';

const options = {style: {moduleSize: 2, quietZone: 1}};
// Kanji mode fits this payload into version 1; UTF-8 octets would need version 2.
const kanjiOptions = {...options, matrix: {kanji}};
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
      <section data-testid="qrcode-kanji-svg">
        <QRCodeSVG payload="東京タワー" options={kanjiOptions} />
      </section>
    </main>
  </StrictMode>,
);
