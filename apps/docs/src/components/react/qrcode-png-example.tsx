import {useMemo} from 'react';

import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/react';

export default function QRCodePNGExample() {
  const options = useMemo<QRCodePNGImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodePNG payload="https://qrcodesdk.dev" options={options} />;
}
