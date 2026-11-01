export type QRCodePayload = string | number;

/**
 * The function of a module, independent of its color: `0` data and error correction, `1` finder
 * ring (including its light gap), `2` finder center, `3` separator, `4` alignment ring (including
 * its light gap), `5` alignment center, `6` timing, `7` format information, and `8` version
 * information.
 */
export type QRCodeModuleRole = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** An immutable square QR code symbol with row-major module data. */
export type QRCodeMatrix = {
  /** Modules per side. */
  readonly size: number;
  /** `1` for dark and `0` for light modules, at index `y * size + x`. */
  readonly modules: readonly (0 | 1)[];
  /** `QRCodeModuleRole` of every module, shared by all matrices of the same size. */
  readonly roles: readonly QRCodeModuleRole[];
};

export type QRCodeVersion =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40;

export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type QRCodeMode = 'numeric' | 'alphanumeric' | 'octet';
export type QRCodeMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type QRCodeColor = `#${string}`;

/**
 * Path data for one shaped piece. It uses only relative `m`, `l`, `h`, `v`, `c`, `a`, and `z`
 * commands in module units, starting from the piece's top-left corner, and is filled with the
 * even-odd rule.
 */
export type QRCodeShapePath = string;

declare const styleValue: unique symbol;

/** A prepared path produced by a shape factory. */
export type QRCodeShapePiece = {readonly [styleValue]: 'path'};
/** A neighbor-dependent module pattern produced by a built-in shape factory. */
export type QRCodeModulePattern = {readonly [styleValue]: 'module'};
/** A finder style produced by `finder()`. */
export type QRCodeFinderStyle = {readonly [styleValue]: 'finder'};
/** An alignment style produced by `alignment()`. */
export type QRCodeAlignmentStyle = {readonly [styleValue]: 'alignment'};

/** A prepared module path or a built-in neighbor-dependent pattern. */
export type QRCodeModuleShape = {
  readonly module: QRCodeShapePiece | QRCodeModulePattern;
};
/** A 7x7 finder ring, including its 5x5 hole. */
export type QRCodeFinderRingShape = {readonly finderRing: QRCodeShapePiece};
/** A 3x3 finder center. */
export type QRCodeFinderCenterShape = {readonly finderCenter: QRCodeShapePiece};
/** A 5x5 alignment ring, including its 3x3 hole. */
export type QRCodeAlignmentRingShape = {readonly alignmentRing: QRCodeShapePiece};
/** A 1x1 alignment center. */
export type QRCodeAlignmentCenterShape = {readonly alignmentCenter: QRCodeShapePiece};
export type QRCodeShape = QRCodeModuleShape &
  QRCodeFinderRingShape &
  QRCodeFinderCenterShape &
  QRCodeAlignmentRingShape &
  QRCodeAlignmentCenterShape;

export type QRCodeVisualStyle = {
  readonly moduleSize?: number;
  readonly quietZone?: number;
  readonly foreground?: QRCodeColor;
  readonly background?: QRCodeColor;
  readonly modules?: QRCodeModuleShape;
  readonly finder?: QRCodeFinderStyle;
  readonly alignment?: QRCodeAlignmentStyle;
};

export type QRCodeTextStyle = {
  readonly moduleSize?: number;
  readonly quietZone?: number;
};

export type QRCodeRenderer<TOutput> = (matrix: QRCodeMatrix) => TOutput;

export type QRCodeMatrixOptions = {
  version?: QRCodeVersion;
  mode?: QRCodeMode;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  mask?: QRCodeMask;
  eci?: boolean;
};

export type QRCodeCenterImageLayout = {
  /** Image width and height as a fraction of the symbol, greater than 0 and at most 1. */
  readonly size?: number;
  /** Cleared border around the image in modules. */
  readonly padding?: number;
  /** Removes the modules behind the image and its padding. */
  readonly clearBackground?: boolean;
};
