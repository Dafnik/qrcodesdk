import {
  ɵencodeGIF as encodeGIF,
  ɵresolveGIFTransparencyThreshold as resolveGIFTransparencyThreshold,
} from '@qrcodesdk/core/internal/gif';

import {type QRCodeImageOptions, createQRCodeImageComponent} from './create-qrcode-image';
import type {QRCodeBaseProps} from './types';

export type QRCodeGIFImageOptions = QRCodeImageOptions & {
  /** Pixels with an alpha value below `threshold` become transparent. Defaults to 128. */
  readonly transparency?: {readonly threshold?: number};
};
export type QRCodeGIFProps = QRCodeBaseProps<QRCodeGIFImageOptions>;

/**
 * Renders the QR code as an image backed by a single-frame GIF data URL. GIF supports 256 colors
 * and binary transparency, so prefer PNG or WebP for transparent backgrounds and photographic
 * center images.
 */
export const QRCodeGIF = /* @__PURE__ */ createQRCodeImageComponent<QRCodeGIFImageOptions>(
  'QRCodeGIF',
  'image/gif',
  (options) => {
    const transparencyThreshold = resolveGIFTransparencyThreshold(options?.transparency?.threshold);
    return (image) => encodeGIF(image, {transparencyThreshold});
  },
);
