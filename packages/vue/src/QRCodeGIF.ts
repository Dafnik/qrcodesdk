import {type QRCodeGIFImageOptions, QRCodeGIFImageRenderer} from '@qrcodesdk/browser/gif';

import {createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodeGIFProps = QRCodeBaseProps<QRCodeGIFImageOptions>;

/** Renders the QR code as an image element backed by a GIF data URL. */
export const QRCodeGIF = /* @__PURE__ */ createQRCodeImageComponent<QRCodeGIFImageOptions>(
  'QRCodeGIF',
  QRCodeGIFImageRenderer,
);
