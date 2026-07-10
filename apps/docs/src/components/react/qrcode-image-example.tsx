import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/react';

export default function QRCodeImageExample() {
  const options: QRCodeImageOptions = {
    size: 8,
    margin: 4,
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };

  return <QRCodeImage data="https://qrcodesdk.dev" options={options} />;
}
