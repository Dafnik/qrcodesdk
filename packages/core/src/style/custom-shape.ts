import {prepareShapePath} from '../shape-path';
import type {QRCodeShape, QRCodeShapePath, QRCodeShapePiece} from '../types';

// Width and height of each piece's box in modules.
const PIECE_SIZES: Record<keyof QRCodeShape, number> = {
  module: 1,
  finderRing: 7,
  finderCenter: 3,
  alignmentRing: 5,
  alignmentCenter: 1,
};

/**
 * Prepares any subset of a shape's relative paths once, for reuse across renderers. Each path must
 * stay within its piece's box: 1 module for `module` and `alignmentCenter`, 7 for `finderRing`, 3
 * for `finderCenter`, and 5 for `alignmentRing`.
 */
export function customShape<Key extends keyof QRCodeShape>(paths: {
  readonly [Piece in Key]: QRCodeShapePath;
}): Pick<QRCodeShape, Key> {
  const shape = {} as {[Piece in Key]: QRCodeShapePiece};
  for (const key of Object.keys(paths) as Key[]) {
    shape[key] = prepareShapePath(
      `customShape.${key}`,
      paths[key],
      PIECE_SIZES[key],
    ) as unknown as QRCodeShapePiece;
  }
  return shape;
}
