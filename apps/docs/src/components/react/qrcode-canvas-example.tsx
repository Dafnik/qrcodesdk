import {useMemo} from 'react';

import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/react';

export default function QRCodeCanvasExample() {
  const options = useMemo<QRCodeCanvasOptions>(
    () => ({
      style: {
        moduleSize: 8,
        quietZone: 4,
        foreground: '#111827',
        background: '#ffffff',
      },
      accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
    }),
    [],
  );

  return <QRCodeCanvas payload="https://qrcodesdk.dev" options={options} />;
}
