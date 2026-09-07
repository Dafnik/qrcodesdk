import type {ComponentPropsWithoutRef} from 'react';

import type {QRCodePayload} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  payload: QRCodePayload;
  options?: TOptions;
};

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
