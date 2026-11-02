import {type QRCodePNGImageOptions, QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';

import {createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodePNGProps = QRCodeBaseProps<QRCodePNGImageOptions>;

/** Renders the QR code as an image element backed by a PNG data URL. */
export const QRCodePNG = /* @__PURE__ */ createQRCodeImageComponent<QRCodePNGImageOptions>(
  'QRCodePNG',
  QRCodePNGImageRenderer,
);
