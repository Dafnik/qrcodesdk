import {useMemo} from 'react';

import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/react';

export default function QRCodeJPEGExample() {
  const options = useMemo<QRCodeJPEGImageOptions>(
    () => ({
      style: {moduleSize: 8, quietZone: 4},
      quality: 90,
      accessibility: {
        alt: 'QR code: scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeJPEG payload="https://qrcodesdk.dev" options={options} />;
}
