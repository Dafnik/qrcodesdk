import type {QRCodeTestFixture} from '@repo/core-testing';
import {create, toString} from 'qrcode';
import type {QRCodeOptions, QRCodeSegment, QRCodeToStringOptions} from 'qrcode';
import qrcodeGenerator from 'qrcode-generator';
import qrcodePackage from 'qrcode/package.json' with {type: 'json'};

import {QRCodeSVGRenderer, qrcode as createQRCodeSDK} from '@qrcodesdk/core';
import type {QRCodeMatrixOptions} from '@qrcodesdk/core';
import qrcodeSDKPackage from '@qrcodesdk/core/package.json' with {type: 'json'};

import type {BenchmarkAdapter} from './types';

export const SVG_PIXELS_PER_MODULE = 8;
export const SVG_QUIET_ZONE_MODULES = 4;

qrcodeGenerator.stringToBytes = (value) => Array.from(new TextEncoder().encode(value));

function qrcodeSDKOptions(fixture: QRCodeTestFixture): QRCodeMatrixOptions {
  return {
    errorCorrectionLevel: fixture.errorCorrectionLevel,
    mask: fixture.mask,
    mode: fixture.mode,
    version: fixture.version,
  };
}

function qrcodeOptions(fixture: QRCodeTestFixture): QRCodeOptions {
  return {
    errorCorrectionLevel: fixture.errorCorrectionLevel ?? 'M',
    maskPattern: fixture.mask,
    version: fixture.version,
  };
}

function qrcodeInput(fixture: QRCodeTestFixture): QRCodeSegment[] {
  switch (fixture.mode) {
    case 'numeric':
      return [{data: fixture.data, mode: 'numeric'}];
    case 'alphanumeric':
      return [{data: fixture.data, mode: 'alphanumeric'}];
    case 'octet':
      return [{data: new TextEncoder().encode(fixture.data), mode: 'byte'}];
    default:
      return [{data: new TextEncoder().encode(fixture.data), mode: 'byte'}];
  }
}

function generatorMode(fixture: QRCodeTestFixture): 'Numeric' | 'Alphanumeric' | 'Byte' {
  switch (fixture.mode) {
    case 'numeric':
      return 'Numeric';
    case 'alphanumeric':
      return 'Alphanumeric';
    case 'octet':
      return 'Byte';
    default:
      return 'Byte';
  }
}

function qrcodeSVGOptions(fixture: QRCodeTestFixture): QRCodeToStringOptions {
  const matrixSize = fixture.version === undefined ? undefined : 17 + 4 * fixture.version;
  const width =
    matrixSize === undefined
      ? undefined
      : (matrixSize + 2 * SVG_QUIET_ZONE_MODULES) * SVG_PIXELS_PER_MODULE;

  return {
    ...qrcodeOptions(fixture),
    margin: SVG_QUIET_ZONE_MODULES,
    type: 'svg',
    width,
  };
}

function createGeneratorQRCode(fixture: QRCodeTestFixture) {
  const qr = qrcodeGenerator(fixture.version ?? 0, fixture.errorCorrectionLevel ?? 'M');
  qr.addData(fixture.data, generatorMode(fixture));
  qr.make(fixture.mask);
  return qr;
}

const qrcodeSDKAdapter: BenchmarkAdapter = {
  id: 'qrcodesdk',
  label: 'QRCodeSDK',
  version: qrcodeSDKPackage.version,
  matrix: (fixture) =>
    createQRCodeSDK(fixture.data).config(qrcodeSDKOptions(fixture)).matrix().length,
  svg: (fixture) =>
    createQRCodeSDK(fixture.data)
      .config(qrcodeSDKOptions(fixture))
      .render(
        QRCodeSVGRenderer({
          margin: SVG_QUIET_ZONE_MODULES,
          size: SVG_PIXELS_PER_MODULE,
        }),
      ).length,
};

const qrcodeAdapter: BenchmarkAdapter = {
  id: 'qrcode',
  label: 'qrcode',
  version: qrcodePackage.version,
  matrix: (fixture) => create(qrcodeInput(fixture), qrcodeOptions(fixture)).modules.size,
  svg: (fixture) => {
    let svg: string | undefined;
    let renderError: Error | undefined;

    toString(qrcodeInput(fixture), qrcodeSVGOptions(fixture), (error, value) => {
      renderError = error ?? undefined;
      svg = value;
    });

    if (renderError) throw renderError;
    if (svg === undefined) throw new Error('qrcode: SVG callback did not run synchronously');
    return svg.length;
  },
};

const qrcodeGeneratorAdapter: BenchmarkAdapter = {
  id: 'qrcode-generator',
  label: 'qrcode-generator',
  version: '2.0.4',
  matrix: (fixture) => createGeneratorQRCode(fixture).getModuleCount(),
  svg: (fixture) =>
    createGeneratorQRCode(fixture).createSvgTag(
      SVG_PIXELS_PER_MODULE,
      SVG_PIXELS_PER_MODULE * SVG_QUIET_ZONE_MODULES,
    ).length,
};

export const BENCHMARK_ADAPTERS = [
  qrcodeSDKAdapter,
  qrcodeAdapter,
  qrcodeGeneratorAdapter,
] as const satisfies readonly BenchmarkAdapter[];
