import {ɵencodeWebP as encodeWebP} from '@qrcodesdk/core/internal/webp';

import {type QRCodeImageOptions, createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodeWebPImageOptions = QRCodeImageOptions;
export type QRCodeWebPProps = QRCodeBaseProps<QRCodeWebPImageOptions>;

/** Renders the QR code as an image backed by a lossless WebP data URL. */
export const QRCodeWebP = /* @__PURE__ */ createQRCodeImageComponent<QRCodeWebPImageOptions>(
  'QRCodeWebP',
  'image/webp',
  () => encodeWebP,
);
