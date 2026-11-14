import type {QRCodeMatrix} from '@qrcodesdk/core';

/** Creates a test matrix from rows of light (`0`) and dark (`1`) modules, all in the data role. */
export function matrixFromRows(rows: readonly (readonly (0 | 1)[])[]): QRCodeMatrix {
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    modules: rows.flat(),
    roles: Array<0>(rows.flat().length).fill(0),
  };
}

/** Returns the modules of a matrix as rows. */
export function matrixToRows({width, height, modules}: QRCodeMatrix): number[][] {
  return Array.from({length: height}, (_, y) => modules.slice(y * width, (y + 1) * width));
}
