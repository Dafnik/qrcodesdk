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
  readonly modules: readonly number[];
  /** `QRCodeModuleRole` of every module, shared by all matrices of the same size. */
  readonly roles: readonly number[];
};

export type QRCodeCodeword = number;
export type QRCodeCodewords = QRCodeCodeword[];
export type QRCodePolynomial = QRCodeCodeword[];
export type QRCodeEncodedPayload = string | QRCodeCodewords;

export type QRCodeEncodedSegment = {
  readonly mode: QRCodeSupportedModeIndicator;
  readonly payload: QRCodeEncodedPayload;
};

export type QRCodeSupportedModeIndicator = 1 | 2 | 4;
export type QRCodeErrorCorrectionLevelValue = 0 | 1 | 2 | 3;

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

/**
 * Module path data indexed by the module's remaining dark neighbors: left `1`, right `2`, top `4`,
 * and bottom `8`. Claimed roles and areas count as light. A single path applies to every neighbor
 * combination. `undefined` fills the module.
 */
export type QRCodeModuleShape = {
  readonly module: QRCodeShapePath | readonly (QRCodeShapePath | undefined)[];
};
/** A 7x7 finder ring, including its 5x5 hole. */
export type QRCodeFinderRingShape = {readonly finderRing: QRCodeShapePath};
/** A 3x3 finder center. */
export type QRCodeFinderCenterShape = {readonly finderCenter: QRCodeShapePath};
/** A 5x5 alignment ring, including its 3x3 hole. */
export type QRCodeAlignmentRingShape = {readonly alignmentRing: QRCodeShapePath};
/** A 1x1 alignment center. */
export type QRCodeAlignmentCenterShape = {readonly alignmentCenter: QRCodeShapePath};
export type QRCodeShape = QRCodeModuleShape &
  QRCodeFinderRingShape &
  QRCodeFinderCenterShape &
  QRCodeAlignmentRingShape &
  QRCodeAlignmentCenterShape;

/**
 * Draws one group of modules, such as the finder patterns, before the remaining modules. Renderer
 * parts, such as center images, run before style parts.
 */
export type QRCodeStylePart = (context: QRCodeDrawContext) => void;

export interface QRCodeDrawContext {
  readonly matrix: QRCodeMatrix;
  /** Stops drawing modules with these roles as modules, because the part draws them itself. */
  claimRoles(...roles: QRCodeModuleRole[]): void;
  /** Stops drawing every module touched by this area in matrix coordinates, leaving the background. */
  claimArea(x: number, y: number, width: number, height: number): void;
  /** Whether a claimed area overlaps this area, so a part can skip patterns behind it. */
  isAreaClaimed(x: number, y: number, width: number, height: number): boolean;
  /** Returns the layer for a color, or for the foreground when the color is omitted. */
  layer(color?: QRCodeColor): QRCodeDrawLayer;
}

/** Collects geometry in matrix coordinates. */
export interface QRCodeDrawLayer {
  /** Draws a rectangle with finite coordinates and non-negative dimensions. */
  rect(x: number, y: number, width: number, height: number): void;
  /** Places a path at finite coordinates, which may be fractional. */
  tile(path: QRCodeShapePath, x: number, y: number): void;
}

export type QRCodeVisualStyle = {
  readonly moduleSize?: number;
  readonly quietZone?: number;
  readonly foreground?: QRCodeColor;
  readonly background?: QRCodeColor;
  readonly modules?: QRCodeModuleShape;
  readonly finder?: QRCodeStylePart;
  readonly alignment?: QRCodeStylePart;
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

export type QRCodeResolvedMatrixOptions = {
  segments: readonly QRCodeEncodedSegment[];
  version: QRCodeVersion;
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue;
  mask: QRCodeMask | undefined;
  eci: boolean;
};
