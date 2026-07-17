import type {QRCodeInputData} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = {
  data: QRCodeInputData;
  options?: TOptions;
  className?: string;
};

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
