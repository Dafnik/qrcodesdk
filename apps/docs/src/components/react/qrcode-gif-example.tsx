import {useMemo} from 'react';

import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/react';

export default function QRCodeGIFExample() {
  const options = useMemo<QRCodeGIFImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeGIF payload="https://qrcodesdk.dev" options={options} />;
}
