import {createApp, h, version} from 'vue';

import {QRCodeCanvas, QRCodeJPEG, QRCodePNG, QRCodeSVG, kanji} from '@qrcodesdk/vue';

const options = {style: {moduleSize: 2, quietZone: 1}};
// Kanji mode fits this payload into version 1; UTF-8 octets would need version 2.
const kanjiOptions = {...options, matrix: {kanji}};
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
        h(QRCodePNG, {payload: 'HELLO', options: imageOptions}),
      ]),
      h('section', {'data-testid': 'qrcode-jpeg'}, [
        h(QRCodeJPEG, {payload: 'HELLO', options: imageOptions}),
      ]),
      h('section', {'data-testid': 'qrcode-canvas'}, [
        h(QRCodeCanvas, {payload: 'HELLO', options}),
      ]),
      h('section', {'data-testid': 'qrcode-kanji-svg'}, [
        h(QRCodeSVG, {payload: '東京タワー', options: kanjiOptions}),
      ]),
    ]),
}).mount('#app');
