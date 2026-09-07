import type {QRCodePayload} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = {
  payload: QRCodePayload;
  options?: TOptions;
};

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
