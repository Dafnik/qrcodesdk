import type {QRCodeColor} from '@qrcodesdk/core';
import {
  ɵencodeJPEG as encodeJPEG,
  ɵresolveJPEGOptions as resolveJPEGOptions,
} from '@qrcodesdk/core/internal/jpeg';

import {type QRCodeImageOptions, createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeImageProps} from './types';

export type QRCodeJPEGImageOptions = QRCodeImageOptions & {
  /** JPEG quality from 1 to 100. Defaults to 92. */
  readonly quality?: number;
  /** Opaque color that transparent pixels are blended onto. Defaults to `#ffffff`. */
  readonly transparency?: {readonly matte?: QRCodeColor};
};
export type QRCodeJPEGProps = QRCodeImageProps<QRCodeJPEGImageOptions>;

/**
 * Renders the QR code as an image backed by a baseline JPEG data URL. JPEG is lossy and has no
 * transparency, so transparent pixels are blended onto the matte color. Prefer PNG or WebP unless
 * JPEG is required.
 */
export const QRCodeJPEG = /* @__PURE__ */ createQRCodeImageComponent<QRCodeJPEGImageOptions>(
  'QRCodeJPEG',
  'image/jpeg',
  (options) => {
    const jpegOptions = resolveJPEGOptions({
      quality: options?.quality,
      matte: options?.transparency?.matte,
    });
    return (image) => encodeJPEG(image, jpegOptions);
  },
);
