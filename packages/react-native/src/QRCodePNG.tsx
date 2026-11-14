import {ɵencodePNG as encodePNG} from '@qrcodesdk/core/internal/raster';
import {ɵzlibDeflate as zlibDeflate} from '@qrcodesdk/core/internal/zlib';

import {type QRCodeImageOptions, createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodePNGImageOptions = QRCodeImageOptions;
export type QRCodePNGProps = QRCodeBaseProps<QRCodePNGImageOptions>;

/** Renders the QR code as an image backed by a PNG data URL. */
export const QRCodePNG = /* @__PURE__ */ createQRCodeImageComponent<QRCodePNGImageOptions>(
  'QRCodePNG',
  'image/png',
  () => (image) => encodePNG(image, zlibDeflate),
);
