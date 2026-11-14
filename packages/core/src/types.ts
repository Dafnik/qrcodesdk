export type QRCodePayload = string | number;

/**
 * The function of a module, independent of its color: `0` data and error correction, `1` finder
 * ring (including its light gap), `2` finder center, `3` separator, `4` alignment ring (including
 * its light gap), `5` alignment center, `6` timing, `7` format information, and `8` version
 * information.
 */
export type QRCodeModuleRole = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * An immutable QR code symbol with row-major module data. Standard and Micro QR codes are square,
 * and rectangular Micro QR (rMQR) codes are wider than they are high.
 */
export type QRCodeMatrix = {
  /** Modules per row. */
  readonly width: number;
  /** Rows of modules. Equal to `width` for standard and Micro QR codes. */
  readonly height: number;
  /** `1` for dark and `0` for light modules, at index `y * width + x`. */
  readonly modules: readonly (0 | 1)[];
  /** `QRCodeModuleRole` of every module, shared by all matrices of the same version. */
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
export type QRCodeEncodingMode = 'numeric' | 'alphanumeric' | 'octet' | 'kanji';
export type QRCodeMode = 'auto' | QRCodeEncodingMode;

/** One unencoded text segment in an explicit QR encoding mode. */
export type QRCodeSegment = {
  readonly mode: QRCodeEncodingMode;
  readonly payload: string;
};

export type QRCodeSegmenterOptions = {
  readonly version: QRCodeVersion;
  readonly eci: boolean;
  /** The Kanji table from the matrix options. Kanji segments are only valid when it is present. */
  readonly kanji?: QRCodeKanji;
};

declare const kanjiValue: unique symbol;

/** The Shift JIS table exported as `kanji` from `@qrcodesdk/core/kanji`. */
export type QRCodeKanji = {readonly [kanjiValue]: 'kanji'};

/**
 * Splits the payload into nonempty segments without changing its text or splitting surrogate pairs.
 * Called once per searched version group.
 */
export type QRCodeSegmenter = (
  payload: QRCodePayload,
  options: QRCodeSegmenterOptions,
) => readonly QRCodeSegment[];
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

declare const symbolValue: unique symbol;

/**
 * An alternative symbol type, such as the Micro QR code returned by `microQR()` from
 * `@qrcodesdk/core/micro` or the rMQR code returned by `rMQR()` from `@qrcodesdk/core/rmqr`.
 * Consumers cannot call or inspect it.
 */
export type QRCodeSymbol = {readonly [symbolValue]: 'symbol'};

/** Matrix options for a standard QR code (versions 1 to 40). */
export type QRCodeStandardMatrixOptions = {
  symbol?: undefined;
  version?: QRCodeVersion;
  /** `auto` detects a single mode unless a segmenter is supplied. Defaults to `auto`. */
  mode?: QRCodeMode;
  /** Optional mixed-mode segmentation. Explicit modes bypass it. */
  segmenter?: QRCodeSegmenter;
  /**
   * Enables Kanji mode with the Shift JIS table from `@qrcodesdk/core/kanji`. Required by the
   * `kanji` mode and Kanji segments, and used by `auto` and `automaticSegmenter` when present.
   */
  kanji?: QRCodeKanji;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  mask?: QRCodeMask;
  eci?: boolean;
};

/**
 * Matrix options for an alternative symbol type. The symbol owns its version and mask, and it
 * supports neither a segmenter nor ECI.
 */
export type QRCodeSymbolMatrixOptions = {
  symbol: QRCodeSymbol;
  /** `auto` detects a single mode. Defaults to `auto`. */
  mode?: QRCodeMode;
  /**
   * Enables Kanji mode with the Shift JIS table from `@qrcodesdk/core/kanji`. Required by the
   * `kanji` mode and used by `auto` when present. Micro QR codes support Kanji mode in M3 and M4,
   * and rMQR codes in every version.
   */
  kanji?: QRCodeKanji;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  version?: never;
  segmenter?: never;
  mask?: never;
  eci?: never;
};

export type QRCodeMatrixOptions = QRCodeStandardMatrixOptions | QRCodeSymbolMatrixOptions;

export type QRCodeCenterImageLayout = {
  /**
   * Square image width and height as a fraction of the shorter symbol side, greater than 0 and at
   * most 1.
   */
  readonly size?: number;
  /** Cleared border around the image in modules. */
  readonly padding?: number;
  /** Removes the modules behind the image and its padding. */
  readonly clearBackground?: boolean;
};
