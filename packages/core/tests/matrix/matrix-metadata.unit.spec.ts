import {describe, expect, test} from 'vitest';

import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type ɵQRCodeMatrixModuleMetadata as QRCodeMatrixModuleMetadata,
  type QRCodeVersion,
  qrcode,
  ɵgenerateQRCodeMatrixWithMetadata,
} from '../../src';
import {createBaseMatrix} from '../../src/matrix/create-base-matrix';
import {ECC_LEVELS_MAP} from '../../src/matrix/error-correction';
import {MASK_FUNCTIONS} from '../../src/matrix/mask';
import {VERSIONS} from '../../src/matrix/version-config';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];

const FUNCTIONAL_ROLES = new Set<QRCodeMatrixModuleMetadata['role']>([
  'finder',
  'separator',
  'timing',
  'alignment',
  'format',
  'version',
  'dark-module',
]);

describe('QR code matrix generation metadata', () => {
  test('matches normal matrix generation for forced and automatic masks', () => {
    for (let mask = 0; mask < 8; mask++) {
      const options = {errorCorrectionLevel: 'Q', mask: mask as QRCodeMask} as const;
      const generated = ɵgenerateQRCodeMatrixWithMetadata('MASK CHECK', options);
      expect(generated.matrix).toEqual(qrcode('MASK CHECK').config(options).matrix());
      expect(generated.mask).toBe(mask);
    }

    const automatic = ɵgenerateQRCodeMatrixWithMetadata('AUTOMATIC MASK');
    expect(automatic.matrix).toEqual(qrcode('AUTOMATIC MASK').matrix());
    expect(automatic.mask).toBeGreaterThanOrEqual(0);
    expect(automatic.mask).toBeLessThanOrEqual(7);
  });

  test('maps the first mode bits to the physical bottom-right placement coordinates', () => {
    const generated = ɵgenerateQRCodeMatrixWithMetadata('1', {version: 1, mask: 0});

    expect(generated.moduleGrid[20]![20]).toMatchObject({
      role: 'mode',
      bitIndex: 0,
      bitCount: 4,
      codewordIndex: 0,
    });
    expect(generated.moduleGrid[20]![19]).toMatchObject({
      role: 'mode',
      bitIndex: 1,
      bitCount: 4,
      codewordIndex: 0,
    });
    expect(generated.moduleGrid[19]![20]).toMatchObject({
      role: 'mode',
      bitIndex: 2,
      bitCount: 4,
      codewordIndex: 0,
    });
    expect(generated.moduleGrid[19]![19]).toMatchObject({
      role: 'mode',
      bitIndex: 3,
      bitCount: 4,
      codewordIndex: 0,
    });
  });

  test.each([1, 2, 7, 32, 40] as const)(
    'matches functional metadata to the reserved grid for version %s',
    (version) => {
      const generated = ɵgenerateQRCodeMatrixWithMetadata('1', {version, mask: 0});
      const {reserved} = createBaseMatrix(version);

      for (let row = 0; row < reserved.length; row++) {
        for (let column = 0; column < reserved.length; column++) {
          const metadata = generated.moduleGrid[row]![column]!;
          expect(FUNCTIONAL_ROLES.has(metadata.role)).toBe(reserved[row]![column] === 1);
        }
      }
    },
  );

  test('classifies every module for every version and error-correction level', () => {
    for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
      for (let version = 1; version <= 40; version++) {
        const generated = ɵgenerateQRCodeMatrixWithMetadata('1', {
          version: version as QRCodeVersion,
          errorCorrectionLevel,
          mask: 0,
        });
        expect(generated.moduleGrid).toHaveLength(generated.matrix.length);
        expect(generated.moduleGrid.every((row) => row.length === generated.matrix.length)).toBe(
          true,
        );
        expect(generated.moduleGrid.flat().every((metadata) => metadata !== undefined)).toBe(true);
      }
    }
  });

  test('tracks semantic bit counts for each supported data mode', () => {
    const numeric = ɵgenerateQRCodeMatrixWithMetadata('12345', {version: 1, mask: 0});
    const alphanumeric = ɵgenerateQRCodeMatrixWithMetadata('HELLO', {version: 1, mask: 0});
    const octet = ɵgenerateQRCodeMatrixWithMetadata('hello', {version: 1, mask: 0});
    const utf8 = ɵgenerateQRCodeMatrixWithMetadata('Grüße', {
      version: 2,
      mode: 'octet',
      mask: 0,
    });

    expect(countRole(numeric, 'mode')).toBe(4);
    expect(countRole(numeric, 'character-count')).toBe(10);
    expect(countRole(numeric, 'payload')).toBe(17);
    expect(countRole(alphanumeric, 'character-count')).toBe(9);
    expect(countRole(alphanumeric, 'payload')).toBe(28);
    expect(countRole(octet, 'eci')).toBe(12);
    expect(countRole(octet, 'payload')).toBe(40);
    expect(countRole(utf8, 'eci')).toBe(12);
    expect(countRole(utf8, 'payload')).toBe(56);
    expect(countRole(numeric, 'terminator')).toBe(4);
    expect(countRole(numeric, 'padding')).toBeGreaterThan(0);
  });

  test('reports and classifies mixed-mode segments', () => {
    const generated = ɵgenerateQRCodeMatrixWithMetadata('ABCDE12345678?A1A', {
      version: 2,
      mask: 0,
    });

    expect(generated.mode).toBe('mixed');
    expect(countRole(generated, 'eci')).toBe(12);
    expect(countRole(generated, 'mode')).toBe(12);
    expect(countRole(generated, 'character-count')).toBe(27);
    expect(countRole(generated, 'payload')).toBe(87);
    expect(countRole(generated, 'terminator')).toBe(4);
    expect(countRole(generated, 'padding')).toBeGreaterThan(0);
  });

  test('handles truncated terminators, padding, ECC, and remainder bits', () => {
    const atCapacity = ɵgenerateQRCodeMatrixWithMetadata('1'.repeat(34), {
      version: 1,
      errorCorrectionLevel: 'M',
      mode: 'numeric',
      mask: 0,
    });
    const withRemainder = ɵgenerateQRCodeMatrixWithMetadata('1', {version: 2, mask: 0});

    expect(countRole(atCapacity, 'terminator')).toBe(0);
    expect(countRole(atCapacity, 'padding')).toBe(0);
    expect(countRole(atCapacity, 'error-correction')).toBeGreaterThan(0);
    expect(countRole(withRemainder, 'remainder')).toBe(7);
    expect(
      withRemainder.moduleGrid
        .flat()
        .filter(({role}) => role === 'remainder')
        .every(
          ({sourceValue, codewordIndex}) =>
            sourceValue === undefined && codewordIndex === undefined,
        ),
    ).toBe(true);
  });

  test('keeps interleaved codeword indices aligned with placement order', () => {
    const version = 10;
    const errorCorrectionLevel = 'H';
    const errorCorrectionLevelValue = ECC_LEVELS_MAP[errorCorrectionLevel];
    const generated = ɵgenerateQRCodeMatrixWithMetadata('INTERLEAVED BLOCKS', {
      version,
      errorCorrectionLevel,
      mask: 5,
    });
    const placed = getDataModulesInPlacementOrder(generated.moduleGrid);
    const codewordModules = placed.filter(({role}) => role !== 'remainder');

    for (let index = 0; index < codewordModules.length; index++) {
      expect(codewordModules[index]!.codewordIndex).toBe(Math.floor(index / 8));
    }

    const eccModules = codewordModules.filter(({role}) => role === 'error-correction');
    const eccCodewordsPerBlock = VERSIONS[version]![0]![errorCorrectionLevelValue]!;
    const blockCount = VERSIONS[version]![1]![errorCorrectionLevelValue]!;
    expect(
      Array.from({length: blockCount}, (_, blockIndex) => eccModules[blockIndex * 8]!.bitIndex),
    ).toEqual(
      Array.from({length: blockCount}, (_, blockIndex) => blockIndex * eccCodewordsPerBlock * 8),
    );
  });

  test('relates unmasked source values to rendered values through the selected mask', () => {
    const generated = ɵgenerateQRCodeMatrixWithMetadata('SOURCE BITS', {
      errorCorrectionLevel: 'H',
      mask: 6,
    });
    const maskFunction = MASK_FUNCTIONS[generated.mask]!;

    for (let row = 0; row < generated.matrix.length; row++) {
      for (let column = 0; column < generated.matrix.length; column++) {
        const metadata = generated.moduleGrid[row]![column]!;
        if (metadata.sourceValue === undefined) continue;
        expect(generated.matrix[row]![column]).toBe(
          metadata.sourceValue ^ (maskFunction(row, column) ? 1 : 0),
        );
      }
    }
  });
});

function countRole(
  generated: ReturnType<typeof ɵgenerateQRCodeMatrixWithMetadata>,
  role: QRCodeMatrixModuleMetadata['role'],
): number {
  return generated.moduleGrid.flat().filter((metadata) => metadata.role === role).length;
}

function getDataModulesInPlacementOrder(
  moduleGrid: readonly (readonly QRCodeMatrixModuleMetadata[])[],
): QRCodeMatrixModuleMetadata[] {
  const result: QRCodeMatrixModuleMetadata[] = [];
  const size = moduleGrid.length;
  let direction = -1;

  for (let rightColumn = size - 1; rightColumn >= 0; rightColumn -= 2) {
    if (rightColumn === 6) rightColumn--;
    let row = direction < 0 ? size - 1 : 0;

    for (let index = 0; index < size; index++) {
      for (let column = rightColumn; column > rightColumn - 2; column--) {
        const metadata = moduleGrid[row]![column]!;
        if (!FUNCTIONAL_ROLES.has(metadata.role)) result.push(metadata);
      }
      row += direction;
    }
    direction = -direction;
  }

  return result;
}
