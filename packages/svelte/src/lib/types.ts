import type {HTMLAttributes} from 'svelte/elements';

import type {QRCodeCanvasOptions, QRCodeImageOptions} from '@qrcodesdk/browser';
import type {QRCodeInputData, QRCodeSVGOptions} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  data: QRCodeInputData;
  options?: TOptions;
};

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;
export type QRCodeImageProps = QRCodeBaseProps<QRCodeImageOptions>;
export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
