import {createApp, h, version} from 'vue';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/vue';

const options = {size: 2, margin: 1};
const imageOptions = {
  ...options,
  alt: 'Framework runtime QR code',
  ariaLabel: 'Framework runtime QR code',
};

createApp({
  render: () =>
    h('main', [
      h('p', {'data-testid': 'framework-version'}, `Vue ${version}`),
      h('section', {'data-testid': 'qrcode-svg'}, [h(QRCodeSVG, {data: 'HELLO', options})]),
      h('section', {'data-testid': 'qrcode-image'}, [
        h(QRCodeImage, {data: 'HELLO', options: imageOptions}),
      ]),
      h('section', {'data-testid': 'qrcode-canvas'}, [h(QRCodeCanvas, {data: 'HELLO', options})]),
    ]),
}).mount('#app');
