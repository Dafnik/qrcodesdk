import type {QRCodeMatrixGenerator} from './matrix/types';
import {throwInvalid} from './options';
import {generateRMQRMatrix} from './rmqr/generate';
import {
  type QRCodeRMQRVersionIndex,
  RMQR_VERSION_COUNT,
  getRMQRHeight,
  getRMQRVersionName,
  getRMQRWidth,
} from './rmqr/tables';
import type {QRCodeSymbol} from './types';

export type {QRCodeSymbol, QRCodeSymbolMatrixOptions} from './types';

/** rMQR code versions, named by height and width in modules. */
export type QRCodeRMQRVersion =
  | 'R7x43'
  | 'R7x59'
  | 'R7x77'
  | 'R7x99'
  | 'R7x139'
  | 'R9x43'
  | 'R9x59'
  | 'R9x77'
  | 'R9x99'
  | 'R9x139'
  | 'R11x27'
  | 'R11x43'
  | 'R11x59'
  | 'R11x77'
  | 'R11x99'
  | 'R11x139'
  | 'R13x27'
  | 'R13x43'
  | 'R13x59'
  | 'R13x77'
  | 'R13x99'
  | 'R13x139'
  | 'R15x43'
  | 'R15x59'
  | 'R15x77'
  | 'R15x99'
  | 'R15x139'
  | 'R17x43'
  | 'R17x59'
  | 'R17x77'
  | 'R17x99'
  | 'R17x139';

/** rMQR code heights in modules. The width is selected for the payload. */
export type QRCodeRMQRHeight = 'R7' | 'R9' | 'R11' | 'R13' | 'R15' | 'R17';

export type QRCodeRMQROptions = {
  /**
   * An exact version, such as `R7x59`, or a height, such as `R7`, whose narrowest width that holds
   * the payload is used. Defaults to the version with the fewest modules that holds the payload.
   */
  readonly version?: QRCodeRMQRVersion | QRCodeRMQRHeight;
};

const INDEXES = Array.from({length: RMQR_VERSION_COUNT}, (_, index) => index);
// Fewest modules first. The one tie, R7x99 and R9x77, goes to the higher symbol, as in zint.
const BY_AREA = INDEXES.slice().sort(
  (a, b) =>
    getRMQRWidth(a) * getRMQRHeight(a) - getRMQRWidth(b) * getRMQRHeight(b) ||
    getRMQRHeight(b) - getRMQRHeight(a),
);

/**
 * Selects a rectangular Micro QR (rMQR) code as the symbol, for `symbol` in the matrix options. rMQR
 * codes are 7 to 17 modules high and 27 to 139 modules wide, support the error-correction levels
 * `M` and `H`, and need a quiet zone of only 2 modules. They hold up to 361 digits, 219
 * alphanumeric characters, 150 bytes, or 92 Kanji characters.
 */
export function rMQR(options?: QRCodeRMQROptions): QRCodeSymbol {
  const version = options?.version;
  let candidates: readonly QRCodeRMQRVersionIndex[] = BY_AREA;
  if (version !== undefined) {
    const exact = INDEXES.filter((index) => getRMQRVersionName(index) === version);
    // Versions of one height are already ordered by width.
    const byHeight = INDEXES.filter((index) => `R${String(getRMQRHeight(index))}` === version);
    candidates = exact.length ? exact : byHeight;
    if (!candidates.length) {
      throwInvalid(
        'rMQR.version',
        'an rMQR version such as R7x43, or a height such as R7',
        version,
      );
    }
  }

  return ((payload, matrixOptions) =>
    generateRMQRMatrix(
      payload,
      matrixOptions,
      candidates,
      version,
    )) satisfies QRCodeMatrixGenerator as unknown as QRCodeSymbol;
}
