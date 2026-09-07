import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {useMemo} from 'react';

import {QRCodeSVG} from '@qrcodesdk/react';

export default function QRCodeSVGExample() {
  const options = useMemo<QRCodeSVGOptions>(
    () => ({
      accessibility: {
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      },
    }),
    [],
  );

  return <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />;
}
