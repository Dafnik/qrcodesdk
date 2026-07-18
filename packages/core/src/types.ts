export type QRCodeInputData = string | number;

export type QRCodeModule = 0 | 1;
export type QRCodeMatrix = QRCodeModule[][];
export type QRCodeMutableMatrix = QRCodeModule[][];
export type QRCodeReservedMatrix = QRCodeModule[][];

export type QRCodeCodeword = number;
export type QRCodeCodewords = QRCodeCodeword[];
export type QRCodePolynomial = QRCodeCodeword[];
export type QRCodeEncodedData = string | QRCodeCodewords;

export type QRCodeModeIndicator = 1 | 2 | 4 | 8;
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
};

export type QRCodeOptions<TRendererOptions> = QRCodeMatrixOptions & TRendererOptions;

export type QRCodeStylingOptions = {
  size?: number;
  margin?: number;
  colors?: Partial<QRCodeStylingColors>;
};

export type QRCodeParsedStylingOptions = Required<Omit<QRCodeStylingOptions, 'colors'>> & {
  colors: QRCodeStylingColors;
};

export type QRCodeResolvedMatrixOptions = {
  data: QRCodeEncodedData;
  version: QRCodeVersion;
  mode: QRCodeSupportedModeIndicator;
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue;
  mask: QRCodeMask | undefined;
};

export type QRCodeAccessibilityOptions = {
  alt?: string;
  ariaLabel?: string;
  title?: string;
};
