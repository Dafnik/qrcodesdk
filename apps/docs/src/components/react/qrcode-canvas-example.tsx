import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {useMemo} from 'react';

import {QRCodeCanvas} from '@qrcodesdk/react';

export default function QRCodeCanvasExample() {
  const options = useMemo<QRCodeCanvasOptions>(
    () => ({
      style: {
        moduleSize: 8,
        quietZone: 4,
        foreground: '#111827',
        background: '#ffffff',
      },
    }),
    [],
  );

  return <QRCodeCanvas data="https://qrcodesdk.dev" options={options} />;
}
