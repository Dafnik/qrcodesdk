import {useMemo, useRef} from 'react';

import {QRCodePNG, type QRCodeDownloadHandle, type QRCodePNGImageOptions} from '@qrcodesdk/react';

export default function QRCodeDownloadPNGExample() {
  const qrcode = useRef<QRCodeDownloadHandle>(null);
  const options = useMemo<QRCodePNGImageOptions>(
    () => ({accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'}}),
    [],
  );

  return (
    <>
      <QRCodePNG payload="https://qrcodesdk.dev" options={options} ref={qrcode} />
      <button onClick={() => qrcode.current?.download('qrcodesdk')} type="button">
        Download PNG
      </button>
    </>
  );
}
