import {useMemo} from 'react';

import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/react';

export default function QRCodeWebPExample() {
  const options = useMemo<QRCodeWebPImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeWebP payload="https://qrcodesdk.dev" options={options} />;
}
