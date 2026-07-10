import {useRef} from 'react';

import {QRCodeImage, type QRCodeImageHandle} from '@qrcodesdk/react';

export default function QRCodeDownloadImageExample() {
  const qrcode = useRef<QRCodeImageHandle>(null);

  return (
    <div className="flex flex-col items-center">
      <QRCodeImage
        data="https://qrcodesdk.dev"
        options={{
          alt: 'QR code for qrcodesdk.dev',
        }}
        ref={qrcode}
      />
      <button
        className="btn-primary"
        onClick={() => qrcode.current?.download('qrcodesdk')}
        type="button">
        Download PNG
      </button>
    </div>
  );
}
