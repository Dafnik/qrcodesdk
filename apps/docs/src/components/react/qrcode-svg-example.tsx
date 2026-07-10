import {QRCodeSVG} from '@qrcodesdk/react';

export default function QRCodeSVGExample() {
  return (
    <QRCodeSVG
      data="https://qrcodesdk.dev"
      options={{
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      }}
    />
  );
}
