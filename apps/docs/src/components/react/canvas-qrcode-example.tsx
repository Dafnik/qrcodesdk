import {CanvasQRCode, type QRCodeCanvasOptions} from '@qrcodesdk/react';

export default function CanvasQRCodeExample() {
  const options: QRCodeCanvasOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  };

  return <CanvasQRCode data="https://qrcodesdk.dev" options={options} />;
}
