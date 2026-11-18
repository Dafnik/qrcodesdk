import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server.browser';

import {
  QRCodeGIF,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  QRCodeWebP,
  finder,
  kanji,
  rasterCenterImage,
  rounded,
  svgCenterImage,
  wifiPayload,
} from '@qrcodesdk/react-native';

// Written by the smoke test: PNG bytes and a data URL of the same center image.
import centerImage from './center-image.json';

const PAYLOAD = 'https://qrcodesdk.dev/react-native';
const style = {moduleSize: 4, modules: rounded(), finder: finder({color: '#1d4ed8'})};
const accessibility = {ariaLabel: 'Hermes runtime QR code'};
const layout = {size: 0.2};
const raster = rasterCenterImage(Uint8Array.from(centerImage.bytes), layout);

const cases = [
  ['svg', QRCodeSVG, PAYLOAD, {style, accessibility}],
  [
    'svg-center-image',
    QRCodeSVG,
    PAYLOAD,
    {
      matrix: {errorCorrectionLevel: 'H'},
      style,
      centerImage: svgCenterImage(centerImage.dataURL, layout),
    },
  ],
  ['svg-kanji', QRCodeSVG, '東京タワー', {matrix: {kanji}}],
  ['svg-wifi', QRCodeSVG, wifiPayload({ssid: 'Office', password: 'secret'}), {}],
  ['png', QRCodePNG, PAYLOAD, {style, accessibility}],
  [
    'png-center-image',
    QRCodePNG,
    PAYLOAD,
    {
      matrix: {errorCorrectionLevel: 'H'},
      style,
      centerImage: raster,
    },
  ],
  ['webp', QRCodeWebP, PAYLOAD, {style, accessibility}],
  ['gif', QRCodeGIF, PAYLOAD, {style, accessibility}],
  ['jpeg', QRCodeJPEG, PAYLOAD, {style, accessibility, quality: 95}],
];

for (const [name, Component, payload, options] of cases) {
  const markup = renderToStaticMarkup(createElement(Component, {payload, options}));
  globalThis.print(JSON.stringify({name, payload, markup}));
}
