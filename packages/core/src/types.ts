export type QRCodeInputData = string | number;

export type QRCodeModule = 0 | 1;
export type QRCodeMatrix = readonly (readonly QRCodeModule[])[];
export type QRCodeMutableMatrix = QRCodeModule[][];
export type QRCodeReservedMatrix = QRCodeModule[][];

export type QRCodeCodeword = number;
export type QRCodeCodewords = QRCodeCodeword[];
export type QRCodePolynomial = QRCodeCodeword[];
export type QRCodeEncodedData = string | QRCodeCodewords;

export type QRCodeEncodedSegment = {
  readonly mode: QRCodeSupportedModeIndicator;
  readonly data: QRCodeEncodedData;
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

export type QRCodeModuleShape =
  'square' | 'circle' | 'rounded' | 'extra-rounded' | 'diagonal' | 'diagonal-rounded';

export type QRCodeFinderShape = 'square' | 'rounded' | 'extra-rounded' | 'circle';

export type QRCodeVisualStyle = {
  readonly moduleSize?: number;
  readonly quietZone?: number;
  readonly foreground?: QRCodeColor;
  readonly background?: QRCodeColor;
  readonly modules?: {
    readonly shape?: QRCodeModuleShape;
    readonly color?: QRCodeColor;
  };
  readonly finder?: {
    readonly outer?: {
      readonly shape?: QRCodeFinderShape;
      readonly color?: QRCodeColor;
    };
    readonly center?: {
      readonly shape?: QRCodeFinderShape;
      readonly color?: QRCodeColor;
    };
  };
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

export type QRCodeImageOverlayOptions<TSource> = {
  readonly source: TSource;
  readonly size?: number;
  readonly padding?: number;
  readonly clearBackground?: boolean;
};

export type QRCodeResolvedVisualStyle = {
  moduleSize: number;
  quietZone: number;
  foreground: QRCodeColor;
  background: QRCodeColor;
  modules: {shape: QRCodeModuleShape; color: QRCodeColor};
  finder: {
    outer: {shape: QRCodeFinderShape; color: QRCodeColor};
    center: {shape: QRCodeFinderShape; color: QRCodeColor};
  };
};

export type QRCodeStyleRole = 'modules' | 'finderOuter' | 'finderCenter';
export type QRCodeStyleRotation = 0 | 90 | 180 | 270;
export type QRCodePaintShape =
  | 'square'
  | 'circle'
  | 'side-rounded'
  | 'corner-rounded'
  | 'corner-extra-rounded'
  | 'opposite-corners-rounded';

type QRCodeStylePrimitiveBase = {
  role: QRCodeStyleRole;
  color: QRCodeColor;
  x: number;
  y: number;
  size: number;
  rotation: QRCodeStyleRotation;
};

export type QRCodeModuleStylePrimitive = QRCodeStylePrimitiveBase & {
  kind: 'module';
  shape: QRCodePaintShape;
};

export type QRCodeFinderRingStylePrimitive = QRCodeStylePrimitiveBase & {
  kind: 'finder-ring';
  role: 'finderOuter';
  shape: QRCodeFinderShape;
};

export type QRCodeFinderCenterStylePrimitive = QRCodeStylePrimitiveBase & {
  kind: 'finder-center';
  role: 'finderCenter';
  shape: QRCodeFinderShape;
};

export type QRCodeStylePrimitive =
  QRCodeModuleStylePrimitive | QRCodeFinderRingStylePrimitive | QRCodeFinderCenterStylePrimitive;

export type QRCodeStyleRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QRCodeStyleLayer = {
  color: QRCodeColor;
  rectangles: readonly QRCodeStyleRectangle[];
  curvedPrimitives: readonly QRCodeStylePrimitive[];
};

export type QRCodeStylePlan = {
  moduleCount: number;
  viewSize: number;
  outputSize: number;
  backgroundColor: QRCodeColor;
  hasCurves: boolean;
  layers: readonly QRCodeStyleLayer[];
};

export type QRCodeResolvedMatrixOptions = {
  segments: readonly QRCodeEncodedSegment[];
  version: QRCodeVersion;
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue;
  mask: QRCodeMask | undefined;
  eci: boolean;
};
