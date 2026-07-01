import type {ParsedQRCodeStylingOptions, QRCodeStylingOptions} from './types';

export function parseQRCodeStylingOptions(
  options?: QRCodeStylingOptions,
): ParsedQRCodeStylingOptions {
  return {
    size: options?.size ?? 5,
    margin: options?.margin ?? 4,
    colors: {
      colorLight: options?.colors?.colorLight ?? '#ffffff',
      colorDark: options?.colors?.colorDark ?? '#000000',
    },
  };
}
