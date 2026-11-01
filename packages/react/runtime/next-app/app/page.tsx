import {rounded} from '@qrcodesdk/core/style';
import {QRCodeSVG} from '@qrcodesdk/react';

import {QRCodeConsumer} from './qrcode-consumer';

export default function Page() {
  return (
    <>
      <QRCodeConsumer />
      <section data-testid="qrcode-server-svg">
        <QRCodeSVG
          payload="SERVER"
          options={{style: {moduleSize: 2, quietZone: 1, modules: rounded()}}}
        />
      </section>
    </>
  );
}
