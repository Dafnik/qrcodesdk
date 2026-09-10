import {useMemo} from 'react';

import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/react';

export default function QRCodeImageExample() {
  const options = useMemo<QRCodeImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      accessibility: {
        alt: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeImage payload="https://qrcodesdk.dev" options={options} />;
}
