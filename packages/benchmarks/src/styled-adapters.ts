import type {QRCodeStylingFixture} from '@repo/core-testing';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
import type QRCodeStylingClass from 'qr-code-styling';
import type {Options as QRCodeStylingLibraryOptions} from 'qr-code-styling';
import qrCodeStylingPackage from 'qr-code-styling/package.json' with {type: 'json'};

import {QRCodeSVGRenderer, qrcode as createQRCodeSDK} from '@qrcodesdk/core';
import type {QRCodeMatrixOptions} from '@qrcodesdk/core';
import qrcodeSDKPackage from '@qrcodesdk/core/package.json' with {type: 'json'};

import type {StyledSVGAdapter} from './types';

type QRCodeStylingConstructor = typeof QRCodeStylingClass;

const require = createRequire(import.meta.url);
const {QRCodeStyling} = require('qr-code-styling/lib/qr-code-styling.common.js') as {
  readonly QRCodeStyling: QRCodeStylingConstructor;
};
const qrCodeStylingDOM = new JSDOM('', {resources: 'usable'});
const sharedJSDOMConstructor = new Proxy(JSDOM, {
  construct: () => qrCodeStylingDOM,
});

function automaticMatrixOptions(fixture: QRCodeStylingFixture): QRCodeMatrixOptions {
  const {version, mode, errorCorrectionLevel, eci} = fixture.matrixOptions;
  return {version, mode, errorCorrectionLevel, eci};
}

function qrCodeStylingMode(
  fixture: QRCodeStylingFixture,
): NonNullable<NonNullable<QRCodeStylingLibraryOptions['qrOptions']>['mode']> {
  switch (fixture.matrixOptions.mode) {
    case 'numeric':
      return 'Numeric';
    case 'alphanumeric':
      return 'Alphanumeric';
    default:
      return 'Byte';
  }
}

export function createQRCodeStylingLibraryOptions(
  fixture: QRCodeStylingFixture,
): QRCodeStylingLibraryOptions {
  const version = fixture.matrixOptions.version;
  if (version === undefined) {
    throw new Error(`Styled benchmark fixture ${fixture.name} must specify a QR code version`);
  }

  const size = fixture.styling.size ?? 5;
  const margin = fixture.styling.margin ?? 4;
  const moduleCount = 17 + 4 * version;
  const renderedSize = (moduleCount + 2 * margin) * size;
  const colorDark = fixture.styling.colors?.colorDark ?? '#000000';

  return {
    type: 'svg',
    width: renderedSize,
    height: renderedSize,
    margin: margin * size,
    data: fixture.data,
    jsdom: sharedJSDOMConstructor,
    qrOptions: {
      typeNumber: version,
      mode: qrCodeStylingMode(fixture),
      errorCorrectionLevel: fixture.matrixOptions.errorCorrectionLevel ?? 'M',
    },
    backgroundOptions: {
      color: fixture.styling.colors?.colorLight ?? '#ffffff',
    },
    dotsOptions: {
      color: fixture.styling.dotsOptions?.color ?? colorDark,
      type: fixture.styling.dotsOptions?.type ?? 'square',
    },
    cornersSquareOptions: {
      color: fixture.styling.cornersSquareOptions?.color ?? colorDark,
      type: fixture.styling.cornersSquareOptions?.type ?? 'square',
    },
    cornersDotOptions: {
      color: fixture.styling.cornersDotOptions?.color ?? colorDark,
      type: fixture.styling.cornersDotOptions?.type ?? 'square',
    },
  };
}

const qrcodeSDKStyledSVGAdapter: StyledSVGAdapter = {
  id: 'qrcodesdk',
  label: 'QRCodeSDK',
  version: qrcodeSDKPackage.version,
  styledSvg: (fixture) =>
    createQRCodeSDK(fixture.data)
      .config(automaticMatrixOptions(fixture))
      .render(QRCodeSVGRenderer(fixture.styling)).length,
};

const qrCodeStylingAdapter: StyledSVGAdapter = {
  id: 'qr-code-styling',
  label: 'qr-code-styling',
  version: qrCodeStylingPackage.version,
  styledSvg: async (fixture) => {
    const qrCode = new QRCodeStyling(createQRCodeStylingLibraryOptions(fixture));
    const output = await qrCode.getRawData('svg');
    if (output === null) throw new Error('qr-code-styling returned no SVG output');
    return Buffer.isBuffer(output) ? output.length : output.size;
  },
};

export const STYLED_SVG_BENCHMARK_ADAPTERS = [
  qrcodeSDKStyledSVGAdapter,
  qrCodeStylingAdapter,
] as const satisfies readonly StyledSVGAdapter[];
