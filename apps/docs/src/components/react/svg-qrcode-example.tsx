import {SVGQRCode} from '@qrcodesdk/react';

export default function SVGQRCodeExample() {
  return (
    <SVGQRCode
      data="https://qrcodesdk.dev"
      options={{
        title: 'QR code for qrcodesdk.dev',
        ariaLabel: 'Scan to open qrcodesdk.dev',
      }}
    />
  );
}
