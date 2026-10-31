import type {QRCodeMatrix} from '@qrcodesdk/core';

/** Creates a test matrix from rows of light (`0`) and dark (`1`) modules, all in the data role. */
export function matrixFromRows(rows: readonly (readonly number[])[]): QRCodeMatrix {
  return {
    size: rows.length,
    modules: rows.flat(),
    roles: Array<number>(rows.length * rows.length).fill(0),
  };
}

/** Returns the modules of a matrix as rows. */
export function matrixToRows({size, modules}: QRCodeMatrix): number[][] {
  return Array.from({length: size}, (_, y) => modules.slice(y * size, (y + 1) * size));
}
