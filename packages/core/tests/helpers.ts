import type {QRCodeMatrix} from '../src/types';

export function toRows({size, modules}: {size: number; modules: ArrayLike<number>}): number[][] {
  return Array.from({length: size}, (_, y) =>
    Array.from({length: size}, (_, x) => modules[y * size + x]!),
  );
}

/** Creates a matrix with every module in the data role. */
export function fromRows(rows: readonly (readonly (0 | 1)[])[]): QRCodeMatrix {
  return {
    size: rows.length,
    modules: rows.flat(),
    roles: Array<0>(rows.length * rows.length).fill(0),
  };
}
