import type {HTMLAttributes} from 'svelte/elements';

import type {
  QRCodeCanvasOptions,
  QRCodeGIFImageOptions,
  QRCodeJPEGImageOptions,
  QRCodePNGImageOptions,
  QRCodeWebPImageOptions,
} from '@qrcodesdk/browser';
import type {QRCodePayload, QRCodeSVGOptions} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  payload: QRCodePayload;
  options?: TOptions;
};

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;
export type QRCodePNGProps = QRCodeBaseProps<QRCodePNGImageOptions>;
export type QRCodeWebPProps = QRCodeBaseProps<QRCodeWebPImageOptions>;
export type QRCodeGIFProps = QRCodeBaseProps<QRCodeGIFImageOptions>;
export type QRCodeJPEGProps = QRCodeBaseProps<QRCodeJPEGImageOptions>;
export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
