import {type QRCodeWebPImageOptions, QRCodeWebPImageRenderer} from '@qrcodesdk/browser/webp';

import {createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodeWebPProps = QRCodeBaseProps<QRCodeWebPImageOptions>;

/** Renders the QR code as an image element backed by a WebP data URL. */
export const QRCodeWebP = /* @__PURE__ */ createQRCodeImageComponent<QRCodeWebPImageOptions>(
  'QRCodeWebP',
  QRCodeWebPImageRenderer,
);
