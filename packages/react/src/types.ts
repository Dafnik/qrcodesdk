import type {ComponentPropsWithoutRef} from 'react';

import type {QRCodeInputData} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'data'
> & {
  data: QRCodeInputData;
  options?: TOptions;
};

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
