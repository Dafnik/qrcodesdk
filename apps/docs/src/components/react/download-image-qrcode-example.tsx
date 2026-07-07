import {useRef} from 'react';

import {ImageQRCode, type ImageQRCodeHandle} from '@qrcodesdk/react';

export default function DownloadImageQRCodeExample() {
  const qrcode = useRef<ImageQRCodeHandle>(null);

  return (
    <div className="flex flex-col items-center">
      <ImageQRCode
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
