import {type QRCodeMatrixOptions, type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

export function renderQRCode<TOutput>(
  data: string,
  options: QRCodeMatrixOptions | undefined,
  renderer: QRCodeRenderer<TOutput>,
): TOutput {
  return qrcode(data)
    .version(options?.version)
    .errorCorrection(options?.errorCorrectionLevel)
    .mode(options?.mode)
    .mask(options?.mask)
    .render(renderer);
}
