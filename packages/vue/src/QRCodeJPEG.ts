import {type QRCodeJPEGImageOptions, QRCodeJPEGImageRenderer} from '@qrcodesdk/browser/jpeg';

import {createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodeJPEGProps = QRCodeBaseProps<QRCodeJPEGImageOptions>;

/** Renders the QR code as an image element backed by a JPEG data URL. */
export const QRCodeJPEG = /* @__PURE__ */ createQRCodeImageComponent<QRCodeJPEGImageOptions>(
  'QRCodeJPEG',
  QRCodeJPEGImageRenderer,
);
