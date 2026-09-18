import type {HTMLAttributes} from 'vue';

import type {QRCodePayload} from '@qrcodesdk/core';

export type QRCodeBaseProps<TOptions> = Omit<
  HTMLAttributes,
  'children' | 'innerHTML' | 'innerText' | 'textContent'
> & {
  payload: QRCodePayload;
  options?: TOptions;
};

export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};

export function withoutManagedContentAttributes(
  attributes: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const safeAttributes = {...attributes};
  delete safeAttributes['innerHTML'];
  delete safeAttributes['innerText'];
  delete safeAttributes['textContent'];
  delete safeAttributes['children'];
  return safeAttributes;
}
