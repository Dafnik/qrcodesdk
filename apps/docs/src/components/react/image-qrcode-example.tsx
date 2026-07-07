import {ImageQRCode, type QRCodeImageOptions} from '@qrcodesdk/react';

export default function ImageQRCodeExample() {
  const options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };

  return <ImageQRCode data="https://qrcodesdk.dev" options={options} />;
}
