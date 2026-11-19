import type {ImageProps, ViewProps} from 'react-native';

import type {QRCodePayload} from '@qrcodesdk/core';

/** Props shared by every component. Other View props apply to the wrapper View. */
export type QRCodeBaseProps<TOptions> = Omit<ViewProps, 'children'> & {
  payload: QRCodePayload;
  options?: TOptions;
};

export type QRCodeImageProps<TOptions> = QRCodeBaseProps<TOptions> & {
  /** Called when the native image loads successfully. */
  onLoad?: ImageProps['onLoad'];
};

export type QRCodeSVGAccessibilityOptions = {
  /** Names the QR code for screen readers. Without it, the QR code is hidden from them. */
  readonly ariaLabel?: string;
};

export type QRCodeImageAccessibilityOptions = {
  /** Names the QR code for screen readers. Without it, the QR code is hidden from them. */
  readonly ariaLabel?: string;
};

/** Returned through the `ref` of the PNG, WebP, GIF, and JPEG components. */
export type QRCodeImageHandle = {
  /** Returns the encoded image as a base64 `data:` URL. */
  toDataURL(): string;
};
