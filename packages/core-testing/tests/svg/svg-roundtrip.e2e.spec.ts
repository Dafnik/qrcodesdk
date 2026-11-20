import {describe, expect, test} from 'vitest';

import {QRCodeSVGRenderer, qrcode, svgCenterImage} from '@qrcodesdk/core';
import {calendarPayload, vcardPayload} from '@qrcodesdk/core/payload';
import {automaticSegmenter} from '@qrcodesdk/core/segmenter';

import {fixtureImageDataURL, fixtureMatrixOptions} from '../../src';
import {
  QR_CODE_CENTER_IMAGE_FIXTURES,
  QR_CODE_ROUNDTRIP_TEST_FIXTURES,
  QR_CODE_STYLE_VARIANT_FIXTURES,
  QR_CODE_STYLING_FIXTURES,
  getAllQRCodeCombinations,
} from '../../src';
import {decodeSvgQRCode} from './svg-helpers';

describe('SVG QR roundtrips', () => {
  test.each(QR_CODE_CENTER_IMAGE_FIXTURES)(
    'decodes $name SVG center image fixture',
    async (fixture) => {
      await expect(
        decodeSvgQRCode(
          qrcode(fixture.payload)
            .options(fixture.matrixOptions)
            .render(
              QRCodeSVGRenderer({
                style: fixture.style,
                centerImage: svgCenterImage(fixtureImageDataURL(fixture.image), {
                  ...fixture.layout,
                  aspectRatio: fixture.image.width / fixture.image.height,
                }),
              }),
            ),
        ),
      ).resolves.toBe(fixture.payload);
    },
  );

  const testSVGRenderer = QRCodeSVGRenderer({style: {moduleSize: 4, quietZone: 4}});

  test.each(
    ['A\u0000B', 'A\u001dB'].flatMap((payload) => [false, true].map((eci) => ({payload, eci}))),
  )('preserves control characters in $payload with ECI $eci', async ({payload, eci}) => {
    await expect(
      decodeSvgQRCode(qrcode(payload).mode('octet').eci(eci).render(testSVGRenderer)),
    ).resolves.toBe(payload);
  });

  test.each(
    ['ABCDE12345678?A1A', 'ABé12345678901234567890', 'AB✅🚀12345678901234567890', '00123'].flatMap(
      (payload) =>
        [false, true].flatMap((optimized) =>
          [false, true].map((eci) => ({payload, optimized, eci})),
        ),
    ),
  )(
    'decodes auto SVG output for $payload, optimized $optimized, ECI $eci',
    async ({payload, optimized, eci}) => {
      await expect(
        decodeSvgQRCode(
          qrcode(payload)
            .mode('auto')
            .eci(eci)
            .segmenter(optimized ? automaticSegmenter : undefined)
            .render(testSVGRenderer),
        ),
      ).resolves.toBe(payload);
    },
  );

  test.each(
    ['Grüße aus Wien', '東京 ✅🚀'].flatMap((payload) => [
      {payload, eci: false},
      {payload, eci: true},
    ]),
  )('decodes forced UTF-8 octet SVG output for $payload with ECI $eci', async ({payload, eci}) => {
    await expect(
      decodeSvgQRCode(qrcode(payload).mode('octet').eci(eci).render(testSVGRenderer)),
    ).resolves.toBe(payload);
  });

  test.each(QR_CODE_ROUNDTRIP_TEST_FIXTURES)('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(testSVGRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each([...getAllQRCodeCombinations()])('decodes $name SVG output', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload).options(fixtureMatrixOptions(fixture)).render(testSVGRenderer),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLING_FIXTURES)('decodes $name SVG styling fixture', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodeSVGRenderer({style: fixture.styling})),
      ),
    ).resolves.toBe(fixture.payload);
  });

  test.each(QR_CODE_STYLE_VARIANT_FIXTURES)('decodes $name SVG style variant', async (fixture) => {
    await expect(
      decodeSvgQRCode(
        qrcode(fixture.payload)
          .options(fixture.matrixOptions)
          .render(QRCodeSVGRenderer({style: fixture.styling})),
      ),
    ).resolves.toBe(fixture.payload);
  });
});

describe('contact and calendar transport fidelity', () => {
  const event = {
    uid: 'roundtrip@example.com',
    timestamp: '2026-11-14T12:00:00Z',
    summary: 'Meeting',
  };
  const examples = [
    {name: 'ASCII contact', payload: vcardPayload({formattedName: 'Ada Lovelace'})},
    {
      name: 'folded Unicode contact',
      payload: vcardPayload({
        formattedName: 'Zoë 日本語 😀',
        note: 'Zoë 日本語 😀;\\\n'.repeat(12),
      }),
    },
    {
      name: 'UTC event',
      payload: calendarPayload({
        ...event,
        start: '2026-12-01T10:00:00+01:00',
        end: '2026-12-01T11:00:00+01:00',
      }),
    },
    {
      name: 'all-day event',
      payload: calendarPayload({...event, allDay: true, start: '2026-12-25', end: '2026-12-26'}),
    },
  ];
  test.each(examples.flatMap((example) => [false, true].map((eci) => ({...example, eci}))))(
    'decodes complete $name with ECI $eci',
    async ({payload, eci}) => {
      await expect(
        decodeSvgQRCode(
          qrcode(payload)
            .eci(eci)
            .render(QRCodeSVGRenderer({style: {moduleSize: 4, quietZone: 4}})),
        ),
      ).resolves.toBe(payload);
    },
  );
});
