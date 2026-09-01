import {QR_CODE_STYLING_FIXTURES} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {
  STYLED_SVG_BENCHMARK_ADAPTERS,
  createQRCodeStylingLibraryOptions,
} from '../src/styled-adapters';

describe('styled SVG benchmark adapters', {timeout: 15_000}, () => {
  test.each(STYLED_SVG_BENCHMARK_ADAPTERS)(
    '$label produces non-empty SVG output for every styling fixture',
    async (adapter) => {
      await adapter.prepare?.();
      for (const fixture of QR_CODE_STYLING_FIXTURES) {
        await expect(Promise.resolve(adapter.styledSvg(fixture))).resolves.toBeGreaterThan(0);
      }
    },
  );

  test('maps fixture dimensions, matrix options, and global colors', () => {
    const fixture = QR_CODE_STYLING_FIXTURES.find(({name}) =>
      name.endsWith('palette-global-navy'),
    )!;

    expect(createQRCodeStylingLibraryOptions(fixture)).toMatchObject({
      type: 'svg',
      width: 540,
      height: 540,
      margin: 48,
      data: fixture.data,
      qrOptions: {
        typeNumber: 5,
        mode: 'Byte',
        errorCorrectionLevel: 'H',
      },
      backgroundOptions: {color: '#ffffff'},
      dotsOptions: {color: '#102a43'},
      cornersSquareOptions: {color: '#102a43'},
      cornersDotOptions: {color: '#102a43'},
    });
  });

  test('keeps per-part colors and every fixture shape type', () => {
    const featureFixture = QR_CODE_STYLING_FIXTURES.find(({name}) =>
      name.endsWith('palette-feature-jewel'),
    )!;
    expect(createQRCodeStylingLibraryOptions(featureFixture)).toMatchObject({
      dotsOptions: {color: '#112233'},
      cornersSquareOptions: {color: '#1f4d3a'},
      cornersDotOptions: {color: '#4a234a'},
    });

    const mapped = QR_CODE_STYLING_FIXTURES.map(createQRCodeStylingLibraryOptions);
    expect(new Set(mapped.map(({dotsOptions}) => dotsOptions?.type))).toEqual(
      new Set(['rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded']),
    );
    expect(new Set(mapped.map(({cornersSquareOptions}) => cornersSquareOptions?.type))).toEqual(
      new Set(['dot', 'square', 'extra-rounded', 'rounded', 'dots', 'classy', 'classy-rounded']),
    );
    expect(new Set(mapped.map(({cornersDotOptions}) => cornersDotOptions?.type))).toEqual(
      new Set(['dot', 'square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded']),
    );
  });
});
