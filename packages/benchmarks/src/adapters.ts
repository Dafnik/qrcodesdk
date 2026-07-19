import type {QRCodeTestFixture} from '@repo/core-testing';
import {createRequire} from 'node:module';
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

type QRCodeGeneratorEncoder = typeof qrcodeGenerator.stringToBytes;

const qrcodeGeneratorDefaultEncoder = qrcodeGenerator.stringToBytes;
const qrcodeGeneratorTextEncoder: QRCodeGeneratorEncoder = (value) =>
  Array.from(new TextEncoder().encode(value));
const require = createRequire(import.meta.url);
const qrcodeGeneratorCommonJS = require('qrcode-generator') as typeof qrcodeGenerator;
const qrcodeGeneratorBundledUTF8Encoder = qrcodeGeneratorCommonJS.stringToBytesFuncs['UTF-8']!;

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

type ReferenceModes = {
  readonly qrcode: 'numeric' | 'alphanumeric' | 'byte';
  readonly qrcodeGenerator: 'Numeric' | 'Alphanumeric' | 'Byte';
};

function referenceModes(mode: QRCodeTestFixture['mode']): ReferenceModes {
  switch (mode) {
    case 'numeric':
      return {qrcode: 'numeric', qrcodeGenerator: 'Numeric'};
    case 'alphanumeric':
      return {qrcode: 'alphanumeric', qrcodeGenerator: 'Alphanumeric'};
    case 'octet':
      return {qrcode: 'byte', qrcodeGenerator: 'Byte'};
    default:
      return {qrcode: 'byte', qrcodeGenerator: 'Byte'};
  }
}

function qrcodeInput(fixture: QRCodeTestFixture): QRCodeSegment[] {
  const mode = referenceModes(fixture.mode).qrcode;
  if (mode === 'numeric') return [{data: fixture.data, mode}];
  if (mode === 'alphanumeric') return [{data: fixture.data, mode}];
  return [{data: new TextEncoder().encode(fixture.data), mode}];
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
  qr.addData(fixture.data, referenceModes(fixture.mode).qrcodeGenerator);
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

function createQRCodeGeneratorAdapter(
  id: BenchmarkAdapter['id'],
  label: string,
  encoder: QRCodeGeneratorEncoder,
): BenchmarkAdapter {
  return {
    id,
    label,
    version: '2.0.4',
    prepare: () => {
      qrcodeGenerator.stringToBytes = encoder;
    },
    matrix: (fixture) => createGeneratorQRCode(fixture).getModuleCount(),
    svg: (fixture) =>
      createGeneratorQRCode(fixture).createSvgTag(
        SVG_PIXELS_PER_MODULE,
        SVG_PIXELS_PER_MODULE * SVG_QUIET_ZONE_MODULES,
      ).length,
  };
}

const qrcodeGeneratorDefaultAdapter = createQRCodeGeneratorAdapter(
  'qrcode-generator-default',
  'qrcode-generator (default)',
  qrcodeGeneratorDefaultEncoder,
);
const qrcodeGeneratorTextEncoderAdapter = createQRCodeGeneratorAdapter(
  'qrcode-generator',
  'qrcode-generator (TextEncoder)',
  qrcodeGeneratorTextEncoder,
);
const qrcodeGeneratorBundledUTF8Adapter = createQRCodeGeneratorAdapter(
  'qrcode-generator-utf8',
  'qrcode-generator (bundled UTF-8)',
  qrcodeGeneratorBundledUTF8Encoder,
);

export const BENCHMARK_ADAPTERS = [
  qrcodeSDKAdapter,
  qrcodeAdapter,
  qrcodeGeneratorDefaultAdapter,
  qrcodeGeneratorTextEncoderAdapter,
  qrcodeGeneratorBundledUTF8Adapter,
] as const satisfies readonly BenchmarkAdapter[];
