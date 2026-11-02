import {useMemo, useRef} from 'react';

import {QRCodePNG, type QRCodeDownloadHandle, type QRCodePNGImageOptions} from '@qrcodesdk/react';

export default function QRCodeDownloadPNGExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);
  const options = useMemo<QRCodePNGImageOptions>(
    () => ({accessibility: {alt: 'QR code for qrcodesdk.dev'}}),
    [],
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodePNG payload="https://qrcodesdk.dev" options={options} ref={qrcode} />
      <button
        className="btn-primary"
        onClick={() => qrcode.current?.download('qrcodesdk')}
        type="button">
        Download PNG
      </button>
    </div>
  );
}
