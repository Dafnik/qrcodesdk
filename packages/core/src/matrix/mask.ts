import type {QRCodeMask} from '../types';

export const QR_CODE_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

type QRCodeMaskFunction = (row: number, column: number) => boolean;

// Mask functions in terms of row and column (JIS X 0510:2004 Table 20).
export const MASK_FUNCTIONS: readonly QRCodeMaskFunction[] = [
  (row: number, column: number): boolean => (row + column) % 2 === 0,
  (row: number): boolean => row % 2 === 0,
  (_row: number, column: number): boolean => column % 3 === 0,
  (row: number, column: number): boolean => (row + column) % 3 === 0,
  (row: number, column: number): boolean => (((row / 2) | 0) + ((column / 3) | 0)) % 2 === 0,
  (row: number, column: number): boolean => ((row * column) % 2) + ((row * column) % 3) === 0,
  (row: number, column: number): boolean => (((row * column) % 2) + ((row * column) % 3)) % 2 === 0,
  (row: number, column: number): boolean => (((row + column) % 2) + ((row * column) % 3)) % 2 === 0,
];
