import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {useMemo, useRef} from 'react';

import {QRCodeImage, type QRCodeDownloadHandle} from '@qrcodesdk/react';

export default function QRCodeDownloadImageExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);
  const options = useMemo<QRCodeImageOptions>(
    () => ({accessibility: {alt: 'QR code for qrcodesdk.dev'}}),
    [],
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeImage data="https://qrcodesdk.dev" options={options} ref={qrcode} />
      <button
        className="btn-primary"
        onClick={() => qrcode.current?.download('qrcodesdk')}
        type="button">
        Download PNG
      </button>
    </div>
  );
}
