import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/react';

export default function QRCodeCanvasExample() {
  const options: QRCodeCanvasOptions = {
    size: 8,
    margin: 4,
    colors: {
      colorDark: '#111827',
      colorLight: '#ffffff',
    },
  };

  return <QRCodeCanvas data="https://qrcodesdk.dev" options={options} />;
}
