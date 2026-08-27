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

export type QRCodeColorHex = `#${string}`;

export type QRCodeDotType =
  'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';

export type QRCodeCornerSquareType = QRCodeDotType | 'dot';
export type QRCodeCornerDotType = QRCodeDotType | 'dot';

export type QRCodeDotsOptions = {
  color?: QRCodeColorHex;
  type?: QRCodeDotType;
};

export type QRCodeCornersSquareOptions = {
  color?: QRCodeColorHex;
  type?: QRCodeCornerSquareType;
};

export type QRCodeCornersDotOptions = {
  color?: QRCodeColorHex;
  type?: QRCodeCornerDotType;
};

export type QRCodeStylingColors = {
  colorLight: QRCodeColorHex;
  colorDark: QRCodeColorHex;
};

export type QRCodeRenderer<TOutput> = (matrix: QRCodeMatrix) => TOutput;

export type QRCodeMatrixOptions = {
  version?: QRCodeVersion;
  mode?: QRCodeMode;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  mask?: QRCodeMask;
  eci?: boolean;
};

export type QRCodeOptions<TRendererOptions> = QRCodeMatrixOptions & TRendererOptions;

export type QRCodeStylingOptions = {
  size?: number;
  margin?: number;
  colors?: Partial<QRCodeStylingColors>;
  dotsOptions?: QRCodeDotsOptions;
  cornersSquareOptions?: QRCodeCornersSquareOptions;
  cornersDotOptions?: QRCodeCornersDotOptions;
};

export type QRCodeImageOverlayOptions<TSource> = {
  source: TSource;
  size?: number;
  padding?: number;
  clearBackground?: boolean;
};

export type ɵQRCodeResolvedImageOverlay<TSource> = {
  source: TSource;
  size: number;
  padding: number;
  clearBackground: boolean;
  imageX: number;
  imageY: number;
  imageSize: number;
  clearX: number;
  clearY: number;
  clearSize: number;
};

export type ɵQRCodeParsedStylingOptions = {
  size: number;
  margin: number;
  colors: QRCodeStylingColors;
  dotsOptions: Required<QRCodeDotsOptions>;
  cornersSquareOptions: Required<QRCodeCornersSquareOptions>;
  cornersDotOptions: Required<QRCodeCornersDotOptions>;
};

export type ɵQRCodeStyleRole = 'dots' | 'cornersSquare' | 'cornersDot';
export type ɵQRCodeStyleRotation = 0 | 90 | 180 | 270;
export type ɵQRCodeModuleShape =
  | 'square'
  | 'dot'
  | 'side-rounded'
  | 'corner-rounded'
  | 'corner-extra-rounded'
  | 'opposite-corners-rounded';

type QRCodeStylePrimitiveBase = {
  role: ɵQRCodeStyleRole;
  color: QRCodeColorHex;
  x: number;
  y: number;
  size: number;
  rotation: ɵQRCodeStyleRotation;
};

export type ɵQRCodeModuleStylePrimitive = QRCodeStylePrimitiveBase & {
  kind: 'module';
  shape: ɵQRCodeModuleShape;
};

export type ɵQRCodeFinderRingStylePrimitive = QRCodeStylePrimitiveBase & {
  kind: 'finder-ring';
  role: 'cornersSquare';
  shape: 'dot' | 'square' | 'extra-rounded';
};

export type ɵQRCodeFinderCenterStylePrimitive = QRCodeStylePrimitiveBase & {
  kind: 'finder-center';
  role: 'cornersDot';
  shape: 'dot' | 'square';
};

export type ɵQRCodeStylePrimitive =
  ɵQRCodeModuleStylePrimitive | ɵQRCodeFinderRingStylePrimitive | ɵQRCodeFinderCenterStylePrimitive;

export type ɵQRCodeStyleRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ɵQRCodeStyleLayer = {
  color: QRCodeColorHex;
  rectangles: readonly ɵQRCodeStyleRectangle[];
  curvedPrimitives: readonly ɵQRCodeStylePrimitive[];
};

export type ɵQRCodeStylePlan = {
  moduleCount: number;
  viewSize: number;
  renderedSize: number;
  backgroundColor: QRCodeColorHex;
  hasCurves: boolean;
  layers: readonly ɵQRCodeStyleLayer[];
};

export type ɵQRCodeResolvedMatrixOptions = {
  segments: readonly QRCodeEncodedSegment[];
  version: QRCodeVersion;
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue;
  mask: QRCodeMask | undefined;
  eci: boolean;
};

export type QRCodeAccessibilityOptions = {
  alt?: string;
  ariaLabel?: string;
  title?: string;
};
