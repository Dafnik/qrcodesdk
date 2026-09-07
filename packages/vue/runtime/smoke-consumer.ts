import {createApp, h, version} from 'vue';

import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/vue';

const options = {style: {moduleSize: 2, quietZone: 1}};
const imageOptions = {
  ...options,
  accessibility: {
    alt: 'Framework runtime QR code',
    ariaLabel: 'Framework runtime QR code',
  },
};

createApp({
  render: () =>
    h('main', [
      h('p', {'data-testid': 'framework-version'}, `Vue ${version}`),
      h('section', {'data-testid': 'qrcode-svg'}, [h(QRCodeSVG, {payload: 'HELLO', options})]),
      h('section', {'data-testid': 'qrcode-image'}, [
        h(QRCodeImage, {payload: 'HELLO', options: imageOptions}),
      ]),
      h('section', {'data-testid': 'qrcode-canvas'}, [
        h(QRCodeCanvas, {payload: 'HELLO', options}),
      ]),
    ]),
}).mount('#app');
