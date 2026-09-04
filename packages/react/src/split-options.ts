import type {QRCodeMatrixOptions} from '@qrcodesdk/core';

export function splitOptions<T extends {readonly matrix?: QRCodeMatrixOptions}>(
  options: T | undefined,
): readonly [QRCodeMatrixOptions | undefined, Omit<T, 'matrix'> | undefined] {
  if (!options) return [undefined, undefined];
  const {matrix, ...renderer} = options;
  return [matrix, renderer];
}
