import {prepareShapePath} from '../shape-path';
import type {QRCodeShape, QRCodeShapePath, QRCodeShapePiece} from '../types';

/** Prepares any subset of a shape's relative paths once, for reuse across renderers. */
export function customShape<Key extends keyof QRCodeShape>(paths: {
  readonly [Piece in Key]: QRCodeShapePath;
}): Pick<QRCodeShape, Key> {
  const shape = {} as {[Piece in Key]: QRCodeShapePiece};
  for (const key of Object.keys(paths) as Key[]) {
    shape[key] = prepareShapePath(`customShape.${key}`, paths[key]) as unknown as QRCodeShapePiece;
  }
  return shape;
}
