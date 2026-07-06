import type {QRCodeRenderer} from '@qrcodesdk/core';

export interface QRCodeDownloadRendererOptions<T> {
  renderer: QRCodeRenderer<T>;
  filename?: string;
}
