import type {
  QRCodeFixtureFinderShape,
  QRCodeFixtureModuleShape,
  QRCodeStylingFixture,
} from '@repo/core-testing';
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

  const {design} = fixture;
  const size = design.moduleSize;
  const quietZone = design.quietZone;
  const moduleCount = 17 + 4 * version;
  const renderedSize = (moduleCount + 2 * quietZone) * size;

  return {
    type: 'svg',
    width: renderedSize,
    height: renderedSize,
    margin: quietZone * size,
    data: fixture.payload,
    jsdom: sharedJSDOMConstructor,
    qrOptions: {
      typeNumber: version,
      mode: qrCodeStylingMode(fixture),
      errorCorrectionLevel: fixture.matrixOptions.errorCorrectionLevel ?? 'M',
    },
    backgroundOptions: {
      color: design.background,
    },
    dotsOptions: {
      color: design.foreground,
      type: mapModuleShape(design.modules),
    },
    cornersSquareOptions: {
      color: design.finder.color,
      type: mapFinderShape(design.finder.ring),
    },
    cornersDotOptions: {
      color: design.finder.color,
      type: mapFinderShape(design.finder.center),
    },
  };
}

const qrcodeSDKStyledSVGAdapter: StyledSVGAdapter = {
  id: 'qrcodesdk',
  label: 'QRCodeSDK',
  version: qrcodeSDKPackage.version,
  styledSvg: (fixture) =>
    createQRCodeSDK(fixture.payload)
      .options(automaticMatrixOptions(fixture))
      .render(QRCodeSVGRenderer({style: fixture.styling})).length,
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

function mapModuleShape(
  shape: QRCodeFixtureModuleShape,
): NonNullable<QRCodeStylingLibraryOptions['dotsOptions']>['type'] {
  switch (shape) {
    case 'circle':
      return 'dots';
    case 'diagonal':
      return 'classy';
    case 'diagonal-rounded':
      return 'classy-rounded';
    case 'rounded':
    case 'extra-rounded':
    case 'square':
      return shape;
    default:
      return 'square';
  }
}

function mapFinderShape(
  shape: QRCodeFixtureFinderShape,
): NonNullable<QRCodeStylingLibraryOptions['cornersSquareOptions']>['type'] {
  switch (shape) {
    case 'circle':
      return 'dot';
    case 'rounded':
    case 'extra-rounded':
      return 'extra-rounded';
    default:
      return 'square';
  }
}
