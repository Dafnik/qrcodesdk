import type {QRCodeRenderer} from '@qrcodesdk/core';

export interface QRCodeDownloadRendererOptions<T> {
  readonly renderer: QRCodeRenderer<T>;
  readonly filename?: string;
}
