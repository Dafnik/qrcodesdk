import type {QRCodeMatrixOptions, QRCodeStylingOptions} from '@qrcodesdk/core';

export type QRCodeStylingFixture = {
  readonly name: string;
  readonly data: string;
  readonly matrixOptions: QRCodeMatrixOptions;
  readonly styling: QRCodeStylingOptions;
};

const STYLING_DATA = 'The quick brown fox jumps over the lazy dog';
const STYLING_MATRIX_OPTIONS = {
  version: 5,
  mode: 'octet',
  errorCorrectionLevel: 'H',
  mask: 0,
} as const satisfies QRCodeMatrixOptions;

const DEFAULT_STYLING = {
  size: 12,
  margin: 4,
} as const satisfies QRCodeStylingOptions;

const GLOBAL_NAVY_STYLING = {
  size: 12,
  margin: 4,
  colors: {
    colorLight: '#ffffff',
    colorDark: '#102a43',
  },
} as const satisfies QRCodeStylingOptions;

const FEATURE_JEWEL_STYLING = {
  size: 12,
  margin: 4,
  dotsOptions: {color: '#112233'},
  cornersSquareOptions: {color: '#1f4d3a'},
  cornersDotOptions: {color: '#4a234a'},
} as const satisfies QRCodeStylingOptions;

const SLATE_ON_IVORY_STYLING = {
  size: 12,
  margin: 4,
  colors: {
    colorLight: '#fffaf0',
    colorDark: '#1f2937',
  },
  dotsOptions: {color: '#2d3748'},
  cornersSquareOptions: {color: '#344e2e'},
  cornersDotOptions: {color: '#512b58'},
} as const satisfies QRCodeStylingOptions;

const EXPLICIT_MONOCHROME_STYLING = {
  size: 12,
  margin: 4,
  colors: {
    colorLight: '#f8fafc',
    colorDark: '#111827',
  },
  dotsOptions: {color: '#111827'},
  cornersSquareOptions: {color: '#111827'},
  cornersDotOptions: {color: '#111827'},
} as const satisfies QRCodeStylingOptions;

const DEEP_MIXED_STYLING = {
  size: 12,
  margin: 4,
  colors: {
    colorLight: '#fdfaf6',
    colorDark: '#3f1d1d',
  },
  dotsOptions: {color: '#17365d'},
  cornersSquareOptions: {color: '#234e3f'},
  cornersDotOptions: {color: '#4c285e'},
} as const satisfies QRCodeStylingOptions;

export const QR_CODE_STYLING_FIXTURES = [
  {
    name: 'dots-rounded_ring-square_center-square_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'rounded'},
      cornersSquareOptions: {type: 'square'},
      cornersDotOptions: {type: 'square'},
    },
  },
  {
    name: 'dots-rounded_ring-extra-rounded_center-dot_palette-global-navy',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...GLOBAL_NAVY_STYLING,
      dotsOptions: {type: 'rounded'},
      cornersSquareOptions: {type: 'extra-rounded'},
      cornersDotOptions: {type: 'dot'},
    },
  },
  {
    name: 'dots-rounded_ring-classy-rounded_center-extra-rounded_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-rounded_ring-dot_center-dot_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'dot'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'dot'},
    },
  },
  {
    name: 'dots-rounded_ring-square_center-square_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'square'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'square'},
    },
  },
  {
    name: 'dots-rounded_ring-extra-rounded_center-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {
        ...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions,
        type: 'extra-rounded',
      },
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-rounded_ring-rounded_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'rounded'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-rounded_ring-dots_center-classy_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'dots'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'classy'},
    },
  },
  {
    name: 'dots-rounded_ring-classy_center-classy-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'classy'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'classy-rounded'},
    },
  },
  {
    name: 'dots-rounded_ring-classy-rounded_center-extra-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'rounded'},
      cornersSquareOptions: {
        ...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions,
        type: 'classy-rounded',
      },
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-dots_ring-square_center-square_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'dots'},
      cornersSquareOptions: {type: 'square'},
      cornersDotOptions: {type: 'square'},
    },
  },
  {
    name: 'dots-dots_ring-extra-rounded_center-dot_palette-global-navy',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...GLOBAL_NAVY_STYLING,
      dotsOptions: {type: 'dots'},
      cornersSquareOptions: {type: 'extra-rounded'},
      cornersDotOptions: {type: 'dot'},
    },
  },
  {
    name: 'dots-dots_ring-classy-rounded_center-extra-rounded_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-dots_ring-dot_center-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'dot'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-dots_ring-square_center-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'square'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-dots_ring-extra-rounded_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'extra-rounded'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-dots_ring-rounded_center-classy_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'classy'},
    },
  },
  {
    name: 'dots-dots_ring-dots_center-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'dots'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-dots_ring-classy_center-extra-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'classy'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-dots_ring-classy-rounded_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'dots'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy_ring-square_center-square_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'classy'},
      cornersSquareOptions: {type: 'square'},
      cornersDotOptions: {type: 'square'},
    },
  },
  {
    name: 'dots-classy_ring-extra-rounded_center-dot_palette-global-navy',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...GLOBAL_NAVY_STYLING,
      dotsOptions: {type: 'classy'},
      cornersSquareOptions: {type: 'extra-rounded'},
      cornersDotOptions: {type: 'dot'},
    },
  },
  {
    name: 'dots-classy_ring-classy-rounded_center-extra-rounded_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-classy_ring-dot_center-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'dot'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy_ring-square_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'square'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy_ring-extra-rounded_center-classy_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'extra-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'classy'},
    },
  },
  {
    name: 'dots-classy_ring-rounded_center-classy-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'rounded'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'classy-rounded'},
    },
  },
  {
    name: 'dots-classy_ring-dots_center-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'dots'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy_ring-classy_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'classy'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy_ring-classy-rounded_center-square_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'classy'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'square'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-square_center-square_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'classy-rounded'},
      cornersSquareOptions: {type: 'square'},
      cornersDotOptions: {type: 'square'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-extra-rounded_center-dot_palette-global-navy',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...GLOBAL_NAVY_STYLING,
      dotsOptions: {type: 'classy-rounded'},
      cornersSquareOptions: {type: 'extra-rounded'},
      cornersDotOptions: {type: 'dot'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-classy-rounded_center-extra-rounded_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-dot_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'dot'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-square_center-classy_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'square'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'classy'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-extra-rounded_center-classy-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'extra-rounded'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'classy-rounded'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-rounded_center-extra-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'rounded'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-dots_center-rounded_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'dots'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-classy_center-square_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'square'},
    },
  },
  {
    name: 'dots-classy-rounded_ring-classy-rounded_center-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'classy-rounded'},
      cornersSquareOptions: {
        ...SLATE_ON_IVORY_STYLING.cornersSquareOptions,
        type: 'classy-rounded',
      },
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-square_ring-square_center-square_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'square'},
      cornersSquareOptions: {type: 'square'},
      cornersDotOptions: {type: 'square'},
    },
  },
  {
    name: 'dots-square_ring-extra-rounded_center-dot_palette-global-navy',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...GLOBAL_NAVY_STYLING,
      dotsOptions: {type: 'square'},
      cornersSquareOptions: {type: 'extra-rounded'},
      cornersDotOptions: {type: 'dot'},
    },
  },
  {
    name: 'dots-square_ring-classy-rounded_center-extra-rounded_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-square_ring-dot_center-dots_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'square'},
      cornersSquareOptions: {type: 'dot'},
      cornersDotOptions: {type: 'dots'},
    },
  },
  {
    name: 'dots-square_ring-square_center-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'square'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-square_ring-extra-rounded_center-extra-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {
        ...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions,
        type: 'extra-rounded',
      },
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-square_ring-rounded_center-dot_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'rounded'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'dot'},
    },
  },
  {
    name: 'dots-square_ring-dots_center-square_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'dots'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'square'},
    },
  },
  {
    name: 'dots-square_ring-classy_center-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'classy'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-square_ring-classy-rounded_center-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'square'},
      cornersSquareOptions: {
        ...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions,
        type: 'classy-rounded',
      },
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-square_center-square_palette-default',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEFAULT_STYLING,
      dotsOptions: {type: 'extra-rounded'},
      cornersSquareOptions: {type: 'square'},
      cornersDotOptions: {type: 'square'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-extra-rounded_center-dot_palette-global-navy',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...GLOBAL_NAVY_STYLING,
      dotsOptions: {type: 'extra-rounded'},
      cornersSquareOptions: {type: 'extra-rounded'},
      cornersDotOptions: {type: 'dot'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-classy-rounded_center-extra-rounded_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-dot_center-classy-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'dot'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'classy-rounded'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-square_center-extra-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'square'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'extra-rounded'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-extra-rounded_center-dot_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'extra-rounded'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'dot'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-rounded_center-square_palette-feature-jewel',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...FEATURE_JEWEL_STYLING,
      dotsOptions: {...FEATURE_JEWEL_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...FEATURE_JEWEL_STYLING.cornersSquareOptions, type: 'rounded'},
      cornersDotOptions: {...FEATURE_JEWEL_STYLING.cornersDotOptions, type: 'square'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-dots_center-rounded_palette-slate-on-ivory',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...SLATE_ON_IVORY_STYLING,
      dotsOptions: {...SLATE_ON_IVORY_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...SLATE_ON_IVORY_STYLING.cornersSquareOptions, type: 'dots'},
      cornersDotOptions: {...SLATE_ON_IVORY_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-classy_center-rounded_palette-explicit-monochrome',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...EXPLICIT_MONOCHROME_STYLING,
      dotsOptions: {...EXPLICIT_MONOCHROME_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersSquareOptions, type: 'classy'},
      cornersDotOptions: {...EXPLICIT_MONOCHROME_STYLING.cornersDotOptions, type: 'rounded'},
    },
  },
  {
    name: 'dots-extra-rounded_ring-classy-rounded_center-classy_palette-deep-mixed',
    data: STYLING_DATA,
    matrixOptions: STYLING_MATRIX_OPTIONS,
    styling: {
      ...DEEP_MIXED_STYLING,
      dotsOptions: {...DEEP_MIXED_STYLING.dotsOptions, type: 'extra-rounded'},
      cornersSquareOptions: {...DEEP_MIXED_STYLING.cornersSquareOptions, type: 'classy-rounded'},
      cornersDotOptions: {...DEEP_MIXED_STYLING.cornersDotOptions, type: 'classy'},
    },
  },
] as const satisfies readonly QRCodeStylingFixture[];
