import {readFileSync} from 'node:fs';
import {describe, expect, expectTypeOf, test} from 'vitest';

import {
  QRCodeError,
  type QRCodeMatrixOptions,
  QRCodeSVGRenderer,
  type QRCodeSymbol,
  QRCodeTextRenderer,
  type QRCodeVisualStyle,
  QR_CODE_MODULE_ROLES as ROLES,
  qrcode,
} from '../../src';
import {createQRCodeCenterImagePlacement} from '../../src/drawing/center-image';
import {createQRCodeStyler} from '../../src/drawing/styler';
import {kanji} from '../../src/kanji';
import {MODE_ALPHANUMERIC, MODE_KANJI, MODE_NUMERIC, MODE_OCTET} from '../../src/matrix/mode';
import {
  type QRCodeRMQRHeight,
  type QRCodeRMQROptions,
  type QRCodeRMQRVersion,
  rMQR,
} from '../../src/rmqr';
import {encodeRMQR, getRMQRModeIndicator} from '../../src/rmqr/encode';
import {createRMQRBaseMatrix, getRMQRFormatBits} from '../../src/rmqr/matrix';
import {
  RMQR_VERSION_COUNT,
  getRMQRBlockCount,
  getRMQRDataCodewords,
  getRMQRHeight,
  getRMQRTotalCodewords,
  getRMQRVersionName,
  getRMQRWidth,
} from '../../src/rmqr/tables';
import {automaticSegmenter} from '../../src/segmenter';
import {alignment, finder, rounded} from '../../src/style';
import type {QRCodeErrorCorrectionLevel, QRCodeMode} from '../../src/types';
import {fixturePayload, toRows} from '../helpers';

type Mode = Exclude<QRCodeMode, 'auto'>;

function rmqr(
  payload: string | number,
  options: QRCodeRMQROptions = {},
  matrixOptions: Omit<QRCodeMatrixOptions, 'symbol'> = {},
) {
  return qrcode(payload)
    .options({...matrixOptions, symbol: rMQR(options)} as QRCodeMatrixOptions)
    .matrix();
}

function expectQRCodeError(run: () => unknown, code: QRCodeError['code'], field?: string): void {
  let error: unknown;
  try {
    run();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(QRCodeError);
  expect((error as QRCodeError).code).toBe(code);
  if (field !== undefined) expect((error as QRCodeError).details.field).toBe(field);
}

const VERSIONS = Array.from({length: RMQR_VERSION_COUNT}, (_, index) => ({
  index,
  name: getRMQRVersionName(index) as QRCodeRMQRVersion,
  width: getRMQRWidth(index),
  height: getRMQRHeight(index),
}));

// ISO/IEC 23941:2022 Table 6: data capacity by version and level, as numeric, alphanumeric, byte,
// and Kanji characters. Wikipedia lists the same values, except a copy error in R11x77-M.
const CAPACITIES: Record<QRCodeRMQRVersion, readonly [M: number[], H: number[]]> = {
  R7x43: [
    [12, 7, 5, 3],
    [5, 3, 2, 1],
  ],
  R7x59: [
    [26, 16, 11, 6],
    [14, 8, 6, 3],
  ],
  R7x77: [
    [45, 27, 19, 11],
    [21, 13, 9, 5],
  ],
  R7x99: [
    [64, 39, 27, 16],
    [30, 18, 13, 8],
  ],
  R7x139: [
    [102, 62, 42, 26],
    [54, 33, 22, 14],
  ],
  R9x43: [
    [26, 16, 11, 6],
    [14, 8, 6, 3],
  ],
  R9x59: [
    [47, 29, 20, 12],
    [23, 14, 10, 6],
  ],
  R9x77: [
    [71, 43, 30, 18],
    [37, 23, 16, 9],
  ],
  R9x99: [
    [97, 59, 40, 25],
    [49, 30, 20, 12],
  ],
  R9x139: [
    [147, 89, 61, 38],
    [75, 46, 31, 19],
  ],
  R11x27: [
    [14, 8, 6, 3],
    [9, 6, 4, 2],
  ],
  R11x43: [
    [42, 26, 18, 11],
    [23, 14, 10, 6],
  ],
  R11x59: [
    [71, 43, 30, 18],
    [33, 20, 14, 8],
  ],
  R11x77: [
    [100, 60, 41, 25],
    [52, 31, 21, 13],
  ],
  R11x99: [
    [133, 81, 55, 34],
    [66, 40, 27, 17],
  ],
  R11x139: [
    [198, 120, 82, 51],
    [97, 59, 40, 25],
  ],
  R13x27: [
    [26, 16, 11, 6],
    [14, 8, 6, 3],
  ],
  R13x43: [
    [62, 37, 26, 16],
    [28, 17, 12, 7],
  ],
  R13x59: [
    [88, 53, 36, 22],
    [45, 27, 18, 11],
  ],
  R13x77: [
    [124, 75, 51, 31],
    [66, 40, 27, 17],
  ],
  R13x99: [
    [171, 104, 71, 44],
    [80, 49, 33, 20],
  ],
  R13x139: [
    [251, 152, 104, 64],
    [126, 76, 52, 32],
  ],
  R15x43: [
    [76, 46, 31, 19],
    [33, 20, 13, 8],
  ],
  R15x59: [
    [112, 68, 46, 28],
    [59, 36, 24, 15],
  ],
  R15x77: [
    [157, 95, 65, 40],
    [71, 43, 29, 18],
  ],
  R15x99: [
    [207, 126, 86, 53],
    [111, 68, 46, 28],
  ],
  R15x139: [
    [301, 182, 125, 77],
    [162, 98, 67, 41],
  ],
  R17x43: [
    [90, 55, 37, 23],
    [47, 28, 19, 12],
  ],
  R17x59: [
    [131, 79, 54, 33],
    [63, 38, 26, 16],
  ],
  R17x77: [
    [183, 111, 76, 47],
    [87, 53, 36, 22],
  ],
  R17x99: [
    [236, 143, 98, 60],
    [131, 79, 54, 33],
  ],
  R17x139: [
    [361, 219, 150, 92],
    [178, 108, 74, 46],
  ],
};
const MODES = ['numeric', 'alphanumeric', 'octet', 'kanji'] as const satisfies readonly Mode[];

// zint's precomputed format information (backend/qr.h): version indicator, plus 32 for level H.
const ZINT_FORMAT_LEFT = [
  0x1fab2, 0x1e597, 0x1dbdd, 0x1c4f8, 0x1b86c, 0x1a749, 0x19903, 0x18626, 0x17f0e, 0x1602b, 0x15e61,
  0x14144, 0x13dd0, 0x122f5, 0x11cbf, 0x1039a, 0x0f1ca, 0x0eeef, 0x0d0a5, 0x0cf80, 0x0b314, 0x0ac31,
  0x0927b, 0x08d5e, 0x07476, 0x06b53, 0x05519, 0x04a3c, 0x036a8, 0x0298d, 0x017c7, 0x008e2, 0x3f367,
  0x3ec42, 0x3d208, 0x3cd2d, 0x3b1b9, 0x3ae9c, 0x390d6, 0x38ff3, 0x376db, 0x369fe, 0x357b4, 0x34891,
  0x33405, 0x32b20, 0x3156a, 0x30a4f, 0x2f81f, 0x2e73a, 0x2d970, 0x2c655, 0x2bac1, 0x2a5e4, 0x29bae,
  0x2848b, 0x27da3, 0x26286, 0x25ccc, 0x243e9, 0x23f7d, 0x22058, 0x21e12, 0x20137,
];
const ZINT_FORMAT_RIGHT = [
  0x20a7b, 0x2155e, 0x22b14, 0x23431, 0x248a5, 0x25780, 0x269ca, 0x276ef, 0x28fc7, 0x290e2, 0x2aea8,
  0x2b18d, 0x2cd19, 0x2d23c, 0x2ec76, 0x2f353, 0x30103, 0x31e26, 0x3206c, 0x33f49, 0x343dd, 0x35cf8,
  0x362b2, 0x37d97, 0x384bf, 0x39b9a, 0x3a5d0, 0x3baf5, 0x3c661, 0x3d944, 0x3e70e, 0x3f82b, 0x003ae,
  0x01c8b, 0x022c1, 0x03de4, 0x04170, 0x05e55, 0x0601f, 0x07f3a, 0x08612, 0x09937, 0x0a77d, 0x0b858,
  0x0c4cc, 0x0dbe9, 0x0e5a3, 0x0fa86, 0x108d6, 0x117f3, 0x129b9, 0x1369c, 0x14a08, 0x1552d, 0x16b67,
  0x17442, 0x18d6a, 0x1924f, 0x1ac05, 0x1b320, 0x1cfb4, 0x1d091, 0x1eedb, 0x1f1fe,
];

/** Reads the 18 format bits beside the finder pattern and beside the finder sub-pattern. */
function readFormat({
  width,
  height,
  modules,
}: {
  width: number;
  height: number;
  modules: readonly number[];
}) {
  let left = 0,
    right = 0;
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      left |= modules[(1 + y) * width + 8 + x]! << (x * 5 + y);
      right |= modules[(height - 6 + y) * width + width - 8 + x]! << (x * 5 + y);
    }
  }
  for (let i = 0; i < 3; i++) {
    left |= modules[(1 + i) * width + 11]! << (15 + i);
    right |= modules[(height - 6) * width + width - 5 + i]! << (15 + i);
  }
  return {left, right};
}

describe('rMQR tables', () => {
  test.each(VERSIONS)(
    'splits the codewords of $name into equal error-correction blocks',
    ({index}) => {
      for (const level of [0, 1] as const) {
        const data = getRMQRDataCodewords(index, level);
        const blocks = getRMQRBlockCount(index, level);
        const errorCorrection = getRMQRTotalCodewords(index) - data;
        expect(errorCorrection % blocks).toBe(0);
        expect(blocks).toBeLessThanOrEqual(data);
      }
      // Level H holds about half the data of level M.
      expect(getRMQRDataCodewords(index, 1)).toBeLessThan(getRMQRDataCodewords(index, 0));
    },
  );

  test.each(VERSIONS)(
    'fills every data module of $name with codewords or remainder bits',
    ({index}) => {
      const {roles} = createRMQRBaseMatrix(index);
      const dataModules = roles.filter((role) => role === ROLES.data).length;
      const remainder = dataModules - getRMQRTotalCodewords(index) * 8;
      expect(remainder).toBeGreaterThanOrEqual(0);
      expect(remainder).toBeLessThan(8);
    },
  );

  test('lists 32 versions from R7x43 to R17x139', () => {
    expect(VERSIONS.map(({name}) => name)).toEqual(Object.keys(CAPACITIES));
  });
});

describe('rMQR encoding', () => {
  test('uses 3-bit mode indicators', () => {
    expect(
      ([MODE_NUMERIC, MODE_ALPHANUMERIC, MODE_OCTET, MODE_KANJI] as const).map((mode) =>
        getRMQRModeIndicator(mode),
      ),
    ).toEqual([1, 2, 3, 4]);
  });

  test('pads with alternating codewords after a truncated terminator', () => {
    // 3 mode bits, 4 count bits, 4 data bits, and 3 terminator bits fill 14 of 48 bits.
    expect(encodeRMQR(0, {mode: MODE_NUMERIC, payload: '1'}, 6)).toEqual([
      0b00100010, 0b00100000, 0xec, 0x11, 0xec, 0x11,
    ]);
    // 3 + 4 + 40 bits leave one bit, so the terminator is truncated to it.
    expect(encodeRMQR(0, {mode: MODE_NUMERIC, payload: '123456789012'}, 6)).toHaveLength(6);
  });

  test.each([0, 1] as const)('writes format information that matches zint at level %i', (level) => {
    for (const {index} of VERSIONS) {
      const format = getRMQRFormatBits(index, level);
      expect(format ^ 0x1fab2).toBe(ZINT_FORMAT_LEFT[index + level * 32]);
      expect(format ^ 0x20a7b).toBe(ZINT_FORMAT_RIGHT[index + level * 32]);
    }
  });

  test.each(VERSIONS)('places both format copies in $name', ({index, name, width, height}) => {
    for (const [level, errorCorrectionLevel] of [
      [0, 'M'],
      [1, 'H'],
    ] as const) {
      const matrix = rmqr('1', {version: name}, {errorCorrectionLevel});
      expect(matrix.width).toBe(width);
      expect(matrix.height).toBe(height);
      expect(readFormat(matrix)).toEqual({
        left: ZINT_FORMAT_LEFT[index + level * 32],
        right: ZINT_FORMAT_RIGHT[index + level * 32],
      });
    }
  });
});

describe('rMQR matrices', () => {
  const references = readFileSync(new URL('__fixtures__/zint-rmqr.txt', import.meta.url))
    .toString()
    .split('\n\n')
    .filter((block) => block.startsWith('{'))
    .map((block) => {
      const [header, ...rows] = block.trim().split('\n');
      return {
        ...(JSON.parse(header!) as {
          payload: string;
          mode: Mode;
          version: QRCodeRMQRVersion | QRCodeRMQRHeight | null;
          errorCorrectionLevel: QRCodeErrorCorrectionLevel;
          symbol: QRCodeRMQRVersion;
        }),
        rows,
      };
    });

  test('loads the zint references', () => {
    expect(references.length).toBeGreaterThan(130);
    expect(new Set(references.map(({symbol}) => symbol))).toEqual(new Set(Object.keys(CAPACITIES)));
    expect(new Set(references.map(({mode}) => mode))).toEqual(new Set(MODES));
  });

  test.each(references)(
    'matches zint for $payload ($mode, $errorCorrectionLevel) as $symbol',
    ({payload, mode, version, errorCorrectionLevel, symbol, rows}) => {
      const matrix = rmqr(
        payload,
        {version: version ?? undefined},
        {mode, errorCorrectionLevel, kanji},
      );
      expect(`R${String(matrix.height)}x${String(matrix.width)}`).toBe(symbol);
      expect(toRows(matrix).map((row) => row.join(''))).toEqual(rows);
    },
  );

  test.each(VERSIONS)('lays out the function patterns of $name', ({name, width, height}) => {
    const matrix = rmqr('1', {version: name});
    const role = (x: number, y: number) => matrix.roles[y * width + x];
    const module = (x: number, y: number) => matrix.modules[y * width + x];
    const count = (value: number) => matrix.roles.filter((r) => r === value).length;

    expect(count(ROLES.finderCenter)).toBe(9);
    expect(count(ROLES.finderRing)).toBe(40);
    expect(count(ROLES.separator)).toBe(height > 7 ? 15 : 7);
    expect(count(ROLES.format)).toBe(36);
    expect(count(ROLES.version)).toBe(0);
    // The finder sub-pattern has the shape of a standard alignment pattern.
    expect(count(ROLES.alignmentCenter)).toBe(1);
    expect(count(ROLES.alignmentRing)).toBe(24);
    expect(role(width - 3, height - 3)).toBe(ROLES.alignmentCenter);
    expect([module(width - 3, height - 3), module(width - 4, height - 3)]).toEqual([1, 0]);
    // Timing patterns along the top and bottom edges, and the corner finder sub-patterns.
    for (let x = 8; x < width - 5; x++) {
      expect(role(x, 0)).toBe(ROLES.timing);
      expect(role(x, height - 1)).toBe(ROLES.timing);
    }
    expect([module(width - 2, 0), module(width - 2, 1), module(width - 1, 1)]).toEqual([1, 0, 1]);
    expect(Object.isFrozen(matrix.modules)).toBe(true);
    expect(Object.isFrozen(matrix.roles)).toBe(true);
    expect(matrix.modules).toHaveLength(width * height);
  });

  test('shares one role grid between matrices of a version', () => {
    expect(rmqr('1', {version: 'R9x59'}).roles).toBe(rmqr('ABC', {version: 'R9x59'}).roles);
  });
});

describe('rMQR version selection', () => {
  test.each(VERSIONS)('holds the documented capacity of $name', ({name}) => {
    for (const [levelIndex, errorCorrectionLevel] of (['M', 'H'] as const).entries()) {
      for (const [modeIndex, mode] of MODES.entries()) {
        const capacity = CAPACITIES[name][levelIndex]![modeIndex]!;
        const options = {mode, errorCorrectionLevel, kanji};
        expect(rmqr(fixturePayload(mode, capacity), {version: name}, options).width).toBe(
          getRMQRWidth(VERSIONS.find((version) => version.name === name)!.index),
        );
        expectQRCodeError(
          () => rmqr(fixturePayload(mode, capacity + 1), {version: name}, options),
          'PAYLOAD_TOO_LARGE',
        );
      }
    }
  });

  test('selects the version with the fewest modules that holds the payload', () => {
    for (const errorCorrectionLevel of ['M', 'H'] as const) {
      for (const length of [1, 6, 12, 20, 30, 45, 70, 100, 150]) {
        const payload = fixturePayload('octet', length);
        const fitting = VERSIONS.filter(({name}) => {
          try {
            rmqr(payload, {version: name}, {errorCorrectionLevel});
            return true;
          } catch {
            return false;
          }
        });
        if (!fitting.length) continue;
        const area = Math.min(...fitting.map(({width, height}) => width * height));
        const matrix = rmqr(payload, {}, {errorCorrectionLevel});
        expect(matrix.width * matrix.height).toBe(area);
      }
    }
    expect(rmqr('1').width * rmqr('1').height).toBe(11 * 27);
  });

  test('selects the narrowest width of a requested height', () => {
    expect([rmqr('1', {version: 'R7'}).width, rmqr('1', {version: 'R7'}).height]).toEqual([43, 7]);
    expect(rmqr('1', {version: 'R11'}).width).toBe(27);
    expect(rmqr(fixturePayload('numeric', 13), {version: 'R7'}).width).toBe(59);
    expect(rmqr(fixturePayload('numeric', 361), {version: 'R17'}).width).toBe(139);
    expectQRCodeError(
      () => rmqr(fixturePayload('numeric', 103), {version: 'R7'}),
      'PAYLOAD_TOO_LARGE',
    );
  });

  test('reports the requested version when the payload does not fit', () => {
    for (const version of ['R7x43', 'R9'] as const) {
      try {
        rmqr(fixturePayload('numeric', 400), {version});
        expect.unreachable();
      } catch (error) {
        expect((error as QRCodeError).details).toEqual({version});
      }
    }
    try {
      rmqr(fixturePayload('numeric', 400));
      expect.unreachable();
    } catch (error) {
      expect((error as QRCodeError).code).toBe('PAYLOAD_TOO_LARGE');
      expect((error as QRCodeError).details).toEqual({});
    }
  });

  test('rejects unknown versions when the symbol is created', () => {
    for (const version of ['R7x27', 'R8', 'M2', 'r7x43', 7, null]) {
      expectQRCodeError(
        () => rMQR({version} as unknown as QRCodeRMQROptions),
        'INVALID_OPTIONS',
        'rMQR.version',
      );
    }
  });

  test('supports only the error-correction levels M and H', () => {
    expect(rmqr('1', {}, {errorCorrectionLevel: 'H'}).height).toBe(11);
    for (const errorCorrectionLevel of ['L', 'Q', 'X'] as const) {
      expectQRCodeError(
        () => rmqr('1', {}, {errorCorrectionLevel} as QRCodeMatrixOptions),
        'INVALID_OPTIONS',
        'errorCorrectionLevel',
      );
    }
  });

  test('rejects matrix options of standard QR codes', () => {
    const rejected = [
      {version: 1},
      {mask: 0},
      {eci: true},
      {segmenter: automaticSegmenter},
    ] as unknown as QRCodeMatrixOptions[];
    for (const options of rejected) {
      expectQRCodeError(() => rmqr('1', {}, options), 'INVALID_OPTIONS', Object.keys(options)[0]);
    }
    expect(rmqr('1', {}, {eci: false} as QRCodeMatrixOptions).width).toBe(27);
  });

  test('defaults to level M through the builder', () => {
    const builder = qrcode('1').options({symbol: rMQR()});
    expect(readFormat(builder.matrix()).left).toBe(ZINT_FORMAT_LEFT[10]);
    expect(builder.errorCorrection('H').matrix()).not.toBe(builder.matrix());
  });

  test('rejects invalid payloads', () => {
    expectQRCodeError(() => rmqr('ABC', {}, {mode: 'numeric'}), 'INVALID_PAYLOAD');
    expectQRCodeError(() => rmqr(-1), 'INVALID_PAYLOAD');
  });
});

describe('rMQR Kanji mode', () => {
  test('encodes Kanji with the table and UTF-8 without it', () => {
    const payload = fixturePayload('kanji', 12);
    expect(rmqr(payload, {}, {kanji}).width * rmqr(payload, {}, {kanji}).height).toBeLessThan(
      rmqr(payload).width * rmqr(payload).height,
    );
    expect(rmqr(payload, {}, {mode: 'kanji', kanji})).toEqual(rmqr(payload, {}, {kanji}));
    expectQRCodeError(() => rmqr(payload, {}, {mode: 'kanji'}), 'INVALID_OPTIONS', 'kanji');
  });
});

describe('rMQR rendering', () => {
  test('renders rectangular SVG and text output with a 2-module quiet zone', () => {
    const builder = qrcode('rMQR').options({symbol: rMQR({version: 'R7x43'})});
    const svg = builder.render(QRCodeSVGRenderer({style: {moduleSize: 2}}));
    expect(svg).toContain('width="94" height="22" viewBox="0 0 47 11"');
    expect(svg).toContain('d="M0 0h47v11H0z"');
    const text = builder.render(QRCodeTextRenderer({layout: 'full', style: {moduleSize: 1}}));
    expect(text.split('\n')).toHaveLength(11);
    expect(text.split('\n')[0]).toHaveLength(47 * 2);
  });

  test('styles the one finder pattern and the finder sub-pattern', () => {
    const style: QRCodeVisualStyle = {
      quietZone: 0,
      finder: finder({ring: rounded(), color: '#ff0000'}),
      alignment: alignment({ring: rounded(), center: rounded(), color: '#0000ff'}),
    };
    for (const version of ['R7x43', 'R13x77'] as const) {
      const matrix = rmqr('1', {version});
      const {layers} = createQRCodeStyler(style)(matrix);
      const finderLayer = layers.find(({color}) => color === '#ff0000')!;
      const alignmentLayer = layers.find(({color}) => color === '#0000ff')!;
      expect(finderLayer.tiles.flatMap(([, positions]) => positions)).toEqual([0, 0]);
      expect(alignmentLayer.tiles.map(([, positions]) => positions)).toEqual([
        [matrix.width - 5, matrix.height - 5],
        [matrix.width - 3, matrix.height - 3],
      ]);
    }
  });

  test('keeps the finder sub-pattern square unless an alignment style draws it', () => {
    const matrix = rmqr('1', {version: 'R11x43'});
    const {layers} = createQRCodeStyler({quietZone: 0, modules: rounded()})(matrix);
    const tiles = layers.flatMap(({tiles}) => tiles.flatMap(([, positions]) => positions));
    const inSubFinder = (x: number, y: number) => x >= matrix.width - 5 && y >= matrix.height - 5;
    const shaped: number[][] = [];
    for (let index = 0; index < tiles.length; index += 2) {
      if (inSubFinder(tiles[index]!, tiles[index + 1]!))
        shaped.push([tiles[index]!, tiles[index + 1]!]);
    }
    expect(shaped).toEqual([]);
    // Other modules, such as the timing patterns, take the module shape.
    expect(tiles.length).toBeGreaterThan(0);
    // Standard QR codes keep shaping their alignment patterns.
    const standard = qrcode('alignment').version(2).matrix();
    const standardTiles = createQRCodeStyler({quietZone: 0, modules: rounded()})(
      standard,
    ).layers.flatMap(({tiles}) => tiles.flatMap(([, positions]) => positions));
    expect(standardTiles.some((value, index) => index % 2 === 0 && value === 16)).toBe(true);
  });

  test('centers a square center image sized from the height', () => {
    const matrix = rmqr('1', {version: 'R11x43'});
    const {part, place} = createQRCodeCenterImagePlacement({size: 0.5, padding: 0});
    expect(place({moduleWidth: 43, moduleHeight: 11, quietZone: 2})).toEqual({
      x: 2 + (43 - 5.5) / 2,
      y: 2 + (11 - 5.5) / 2,
      size: 5.5,
    });
    const areas: number[][] = [];
    part({
      matrix,
      claimRoles: () => undefined,
      claimArea: (...area) => areas.push(area),
      isAreaCleared: () => false,
      layer: () => ({rect: () => undefined, tile: () => undefined}),
    });
    expect(areas).toEqual([[18, 2, 7, 7]]);
  });

  test('types the options', () => {
    expectTypeOf(rMQR).returns.toEqualTypeOf<QRCodeSymbol>();
    expectTypeOf<QRCodeRMQROptions['version']>().toEqualTypeOf<
      QRCodeRMQRVersion | QRCodeRMQRHeight | undefined
    >();
    // @ts-expect-error R7x27 is not an rMQR version.
    expect(() => rMQR({version: 'R7x27'})).toThrow(QRCodeError);
  });
});
