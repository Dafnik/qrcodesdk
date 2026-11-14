import {cleanup, render} from '@testing-library/react';
import {
  LOGO_IMAGE,
  QR_CODE_STYLING_FIXTURES,
  encodeFixturePNG,
  fixtureImageDataURL,
} from '@repo/core-testing';
import {decodeQRCode} from '@repo/core-testing/decoder/node';
import {createRef} from 'react';
import sharp from 'sharp';
import {afterEach, describe, expect, expectTypeOf, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode, svgCenterImage as coreSVGCenterImage} from '@qrcodesdk/core';
import {QRCodeError} from '@qrcodesdk/core/error';
import {rMQR} from '@qrcodesdk/core/rmqr';
import {ɵcreateRGBARenderer as createRGBARenderer} from '@qrcodesdk/core/internal/raster';

import * as api from '../src';
import {encodeBase64} from '../src/base64';
import {hostProps} from './mocks/host';

const {QRCodeGIF, QRCodeJPEG, QRCodePNG, QRCodeSVG, QRCodeWebP} = api;
const IMAGE_COMPONENTS = [
  {name: 'PNG', mimeType: 'image/png', Component: QRCodePNG, lossless: true},
  {name: 'WebP', mimeType: 'image/webp', Component: QRCodeWebP, lossless: true},
  {name: 'GIF', mimeType: 'image/gif', Component: QRCodeGIF, lossless: true},
  {name: 'JPEG', mimeType: 'image/jpeg', Component: QRCodeJPEG, lossless: false},
] as const;

afterEach(() => {
  cleanup();
});

/** Reads the fill and path data of each `<path>` in serialized SVG. */
function corePaths(svg: string) {
  return [
    ...svg.matchAll(/<path fill="([^"]+)"(?: fill-opacity="([^"]+)")?[^>]* d="([^"]+)"/g),
  ].map(([, fill, opacity, d]) => ({
    fill,
    fillOpacity: opacity === undefined ? undefined : Number(opacity),
    d,
  }));
}

function nativePaths(container: ParentNode) {
  return hostProps(container, 'Path').map(({fill, fillOpacity, d}) => ({
    fill,
    fillOpacity:
      fillOpacity === undefined ? undefined : Math.round(Number(fillOpacity) * 1e6) / 1e6,
    d,
  }));
}

function imageSource(container: ParentNode): {uri: string; width: number; height: number} {
  const [image] = hostProps(container, 'Image');
  return image!['source'] as {uri: string; width: number; height: number};
}

async function decodeDataURL(uri: string) {
  const bytes = Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
  const {data, info} = await sharp(bytes)
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return {width: info.width, height: info.height, data};
}

describe('QRCodeSVG', () => {
  test('renders rectangular symbols with separate width and height', () => {
    const {container} = render(
      <QRCodeSVG payload="12345" options={{matrix: {symbol: rMQR()}, style: {moduleSize: 3}}} />,
    );

    expect(hostProps(container, 'Svg')[0]).toMatchObject({
      width: 93,
      height: 45,
      viewBox: '0 0 31 15',
    });
    expect(hostProps(container, 'Path')[0]).toMatchObject({d: 'M0 0h31v15H0z'});
  });

  test.each(QR_CODE_STYLING_FIXTURES)(
    'draws the same paths as the core SVG renderer for $name',
    ({payload, matrixOptions, styling}) => {
      const {container} = render(
        <QRCodeSVG payload={payload} options={{matrix: matrixOptions, style: styling}} />,
      );
      const svg = qrcode(payload)
        .options(matrixOptions)
        .render(QRCodeSVGRenderer({style: styling}));
      const expected = corePaths(svg).map((path) => ({
        ...path,
        fillOpacity:
          path.fillOpacity === undefined ? undefined : Math.round(path.fillOpacity * 1e6) / 1e6,
      }));

      expect(nativePaths(container)).toEqual(expected);
      const [svgProps] = hostProps(container, 'Svg');
      const size = /width="(\d+)"/.exec(svg)![1];
      expect(svgProps).toMatchObject({
        width: Number(size),
        height: Number(size),
        viewBox: /viewBox="([^"]+)"/.exec(svg)![1],
      });
      expect(
        hostProps(container, 'Path')
          .slice(1)
          .every((path) => path['fillRule'] === 'evenodd'),
      ).toBe(true);
    },
  );

  test('splits translucent colors into a fill and its opacity', () => {
    const style = {foreground: '#11223380', background: '#ffffff00'} as const;
    const {container} = render(<QRCodeSVG payload="HELLO" options={{style}} />);
    const [background, foreground] = hostProps(container, 'Path');

    expect(background).toMatchObject({fill: '#ffffff', fillOpacity: 0});
    expect(foreground).toMatchObject({fill: '#112233', fillOpacity: 128 / 255});
  });

  test('places center images like the core SVG renderer', () => {
    const source = fixtureImageDataURL(LOGO_IMAGE);
    const layout = {size: 0.25, padding: 2};
    const {container} = render(
      <QRCodeSVG
        payload="https://qrcodesdk.dev"
        options={{
          matrix: {errorCorrectionLevel: 'H'},
          centerImage: api.svgCenterImage(source, layout),
        }}
      />,
    );
    const svg = qrcode('https://qrcodesdk.dev')
      .errorCorrection('H')
      .render(QRCodeSVGRenderer({centerImage: coreSVGCenterImage(source, layout)}));

    expect(nativePaths(container)).toEqual(corePaths(svg));
    const [, x, y, width, height] =
      /<image href="[^"]+" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/.exec(svg)!;
    const [image] = hostProps(container, 'SvgImage');
    expect(image).toMatchObject({href: source, preserveAspectRatio: 'xMidYMid meet'});
    for (const [key, value] of Object.entries({x, y, width, height})) {
      expect(Number(image![key])).toBeCloseTo(Number(value), 5);
    }
  });

  test('accepts bundled assets and URI sources as center images', () => {
    for (const source of [
      42,
      {uri: 'https://qrcodesdk.dev/logo.png'},
      [{uri: 'file:///logo.png'}],
    ]) {
      const {container, unmount} = render(
        <QRCodeSVG payload="HELLO" options={{centerImage: api.svgCenterImage(source)}} />,
      );
      expect(hostProps(container, 'SvgImage')[0]).toMatchObject({href: source});
      unmount();
    }
  });

  test.each([
    ['an empty object', {}],
    ['a remote URL string', 'https://qrcodesdk.dev/logo.png'],
    ['an empty array', []],
    ['null', null],
  ])('rejects %s as a center image source', (_name, source) => {
    expect(() => api.svgCenterImage(source as never)).toThrow(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
  });

  test('validates the center image layout', () => {
    expect(() => api.svgCenterImage(42, {size: 2})).toThrow(QRCodeError);
  });
});

describe('accessibility', () => {
  test.each([{name: 'SVG', Component: QRCodeSVG}, ...IMAGE_COMPONENTS])(
    'labels $name output as one image or hides it',
    ({Component}) => {
      const {container} = render(
        <>
          <Component payload="HELLO" options={{accessibility: {ariaLabel: '  Scan me  '}}} />
          <Component payload="HELLO" />
          <Component payload="HELLO" options={{accessibility: {ariaLabel: ' '}}} />
        </>,
      );
      const views = hostProps(container, 'View');

      expect(views[0]).toEqual({accessible: true, role: 'img', 'aria-label': 'Scan me'});
      expect(views[1]).toEqual({'aria-hidden': true});
      expect(views[2]).toEqual({'aria-hidden': true});
    },
  );

  test('passes View props to the wrapper and lets them override the defaults', () => {
    const {container} = render(
      <QRCodeSVG payload="HELLO" testID="qrcode" style={{margin: 8}} aria-hidden={false} />,
    );

    expect(hostProps(container, 'View')[0]).toEqual({
      'aria-hidden': false,
      testID: 'qrcode',
      style: {margin: 8},
    });
  });
});

describe('image components', () => {
  test.each(IMAGE_COMPONENTS)(
    '$name preserves rectangular image dimensions',
    async ({Component}) => {
      const {container} = render(
        <Component payload="12345" options={{matrix: {symbol: rMQR()}, style: {moduleSize: 3}}} />,
      );
      const source = imageSource(container);
      const decoded = await decodeDataURL(source.uri);

      expect(source).toMatchObject({width: 93, height: 45});
      expect(hostProps(container, 'Image')[0]!['style']).toEqual({width: 93, height: 45});
      expect({width: decoded.width, height: decoded.height}).toEqual({width: 93, height: 45});
    },
  );

  test.each(IMAGE_COMPONENTS)(
    'shows $name pixels drawn by the shared rasterizer',
    async ({Component, mimeType, lossless}) => {
      const style = {
        moduleSize: 3,
        quietZone: 2,
        foreground: '#123456',
        background: '#fedcba',
      } as const;
      const {container} = render(<Component payload="HELLO" options={{style}} />);
      const source = imageSource(container);
      const expected = qrcode('HELLO').render(createRGBARenderer(style, undefined));

      expect(source.uri.startsWith(`data:${mimeType};base64,`)).toBe(true);
      expect(source).toMatchObject({width: expected.width, height: expected.height});
      expect(hostProps(container, 'Image')[0]!['style']).toEqual({
        width: expected.width,
        height: expected.height,
      });
      const decoded = await decodeDataURL(source.uri);
      expect(decoded.width).toBe(expected.width);
      if (lossless) {
        expect(decoded.data.equals(Buffer.from(expected.data))).toBe(true);
      } else {
        let maximum = 0;
        for (let index = 0; index < decoded.data.length; index++) {
          maximum = Math.max(maximum, Math.abs(decoded.data[index]! - expected.data[index]!));
        }
        expect(maximum).toBeLessThan(48);
      }
    },
  );

  test.each(IMAGE_COMPONENTS)('$name output scans', async ({Component}) => {
    const payload = 'https://qrcodesdk.dev/react-native';
    const {container} = render(
      <Component payload={payload} options={{style: {modules: api.rounded(), moduleSize: 6}}} />,
    );
    const decoded = await decodeDataURL(imageSource(container).uri);

    const scan = await decodeQRCode(
      new Uint8ClampedArray(decoded.data),
      decoded.width,
      decoded.height,
    );
    expect(scan.text).toBe(payload);
  });

  test.each(IMAGE_COMPONENTS)('$name exposes the data URL through a ref', ({Component}) => {
    const ref = createRef<api.QRCodeImageHandle>();
    const {container} = render(<Component payload="HELLO" ref={ref} />);

    expect(ref.current!.toDataURL()).toBe(imageSource(container).uri);
  });

  test('draws raster center images from PNG bytes', async () => {
    const centerImage = api.rasterCenterImage(encodeFixturePNG(LOGO_IMAGE), {size: 0.25});
    const options = {matrix: {errorCorrectionLevel: 'H' as const}, centerImage};
    const {container} = render(<QRCodePNG payload="https://qrcodesdk.dev" options={options} />);
    const plain = render(
      <QRCodePNG payload="https://qrcodesdk.dev" options={{matrix: options.matrix}} />,
    );

    const withImage = await decodeDataURL(imageSource(container).uri);
    const withoutImage = await decodeDataURL(imageSource(plain.container).uri);
    expect(withImage.data.equals(withoutImage.data)).toBe(false);
    const scan = await decodeQRCode(
      new Uint8ClampedArray(withImage.data),
      withImage.width,
      withImage.height,
    );
    expect(scan.text).toBe('https://qrcodesdk.dev');
  });

  test('rejects invalid raster center images', () => {
    expect(() => api.rasterCenterImage(Uint8Array.of(1, 2, 3))).toThrow(
      expect.objectContaining({code: 'INVALID_IMAGE_SOURCE'}),
    );
    expect(() => api.rasterCenterImage(encodeFixturePNG(LOGO_IMAGE), {padding: -1})).toThrow(
      QRCodeError,
    );
  });

  test('validates format options while rendering', () => {
    expect(() =>
      render(<QRCodeGIF payload="HELLO" options={{transparency: {threshold: 300}}} />),
    ).toThrow(QRCodeError);
    expect(() => render(<QRCodeJPEG payload="HELLO" options={{quality: 0}} />)).toThrow(
      QRCodeError,
    );
  });

  test('throws QRCodeError for invalid payloads while rendering', () => {
    expect(() => render(<QRCodePNG payload={'A'.repeat(8000)} />)).toThrow(QRCodeError);
    expect(() => render(<QRCodeSVG payload={'A'.repeat(8000)} />)).toThrow(QRCodeError);
  });
});

describe('package exports', () => {
  test('re-exports the payload helpers, styles, Kanji table, and segmenter', () => {
    expect(api.wifiPayload({ssid: 'Office', password: 'secret'})).toBe(
      'WIFI:T:WPA;S:Office;P:secret;;',
    );
    for (const name of [
      'alignment',
      'circle',
      'customShape',
      'diagonal',
      'finder',
      'rounded',
      'automaticSegmenter',
      'microQR',
      'calendarPayload',
      'vcardPayload',
    ] as const) {
      expect(typeof api[name]).toBe('function');
    }
    expect(api.kanji).toBeDefined();
  });

  test('enables Kanji mode through matrix options', () => {
    const paths = (matrix: api.QRCodeMatrixOptions) => {
      const {container, unmount} = render(<QRCodeSVG payload="東京タワー" options={{matrix}} />);
      const result = nativePaths(container);
      unmount();
      return result;
    };

    expect(paths({kanji: api.kanji})).toEqual(paths({mode: 'kanji', kanji: api.kanji}));
    expect(paths({kanji: api.kanji})).not.toEqual(paths({}));
  });

  test('accepts payload and options props', () => {
    expectTypeOf<api.QRCodeSVGProps>().toHaveProperty('payload');
    expectTypeOf<api.QRCodePNGProps>().toHaveProperty('options');
  });
});

describe('base64', () => {
  test.each([0, 1, 2, 3, 4, 5, 100, 0x6000, 0x6001, 100_000])('encodes %i bytes', (length) => {
    const bytes = new Uint8Array(length);
    for (let index = 0; index < length; index++) bytes[index] = (index * 131 + 7) & 255;
    expect(encodeBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
  });
});
