import type {QRCodeMatrixOptions, QRCodeShape, QRCodeVisualStyle} from '@qrcodesdk/core';
import {alignment, circle, customShape, diagonal, finder, rounded} from '@qrcodesdk/core/style';

/**
 * Style options beyond the module, finder, and palette combinations of the styling fixtures:
 * alignment patterns, sizes, shape options, custom shapes, and translucent colors.
 */
export type QRCodeStyleVariantFixture = {
  readonly name: string;
  readonly payload: string;
  readonly matrixOptions: QRCodeMatrixOptions;
  readonly styling: QRCodeVisualStyle;
};

// Version 10 has six alignment patterns.
const payload = 'https://qrcodesdk.dev/guides/customize/?variant=style';
const matrixOptions: QRCodeMatrixOptions = {version: 10, errorCorrectionLevel: 'M', mask: 4};

function alignmentFixture(name: string, shape?: QRCodeShape): QRCodeStyleVariantFixture {
  return {
    name: `alignment-${name}`,
    payload,
    matrixOptions,
    styling: {
      moduleSize: 4,
      modules: shape,
      finder: finder({ring: shape, center: shape, color: '#1d4ed8'}),
      alignment: alignment({ring: shape, center: shape, color: '#b91c1c'}),
    },
  };
}

const customModules = customShape({module: 'm0.5 0l0.5 0.5l-0.5 0.5l-0.5 -0.5z'});
const customParts = customShape({
  finderRing:
    'm0 1a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z m1 0v5h5v-5z',
  finderCenter:
    'm0.5 0h2a0.5 0.5 0 0 1 0.5 0.5v2a0.5 0.5 0 0 1 -0.5 0.5h-2a0.5 0.5 0 0 1 -0.5 -0.5v-2a0.5 0.5 0 0 1 0.5 -0.5z',
  alignmentRing: 'm0 0h5v5h-5z m1 1v3h3v-3z',
  alignmentCenter: 'm0.5 0a0.5 0.5 0 1 1 0 1a0.5 0.5 0 1 1 0 -1z',
});

export const QR_CODE_STYLE_VARIANT_FIXTURES: readonly QRCodeStyleVariantFixture[] = [
  alignmentFixture('square'),
  alignmentFixture('rounded', rounded()),
  alignmentFixture('extra-rounded', rounded({radius: 1})),
  alignmentFixture('diagonal', diagonal()),
  alignmentFixture('circle', circle()),
  {
    name: 'alignment-mixed-shapes',
    payload,
    matrixOptions,
    styling: {
      moduleSize: 4,
      alignment: alignment({ring: circle(), center: rounded({radius: 1}), color: '#047857'}),
    },
  },
  {name: 'module-size-1', payload, matrixOptions, styling: {moduleSize: 1}},
  {
    name: 'module-size-3-quiet-zone-1',
    payload,
    matrixOptions,
    styling: {moduleSize: 3, quietZone: 1},
  },
  {name: 'quiet-zone-0', payload, matrixOptions, styling: {moduleSize: 4, quietZone: 0}},
  {name: 'quiet-zone-10', payload, matrixOptions, styling: {moduleSize: 4, quietZone: 10}},
  {
    name: 'rounded-radius-quarter',
    payload,
    matrixOptions,
    styling: {
      moduleSize: 4,
      modules: rounded({radius: 0.25}),
      finder: finder({ring: rounded({radius: 0.25}), center: rounded({radius: 0.25})}),
    },
  },
  {
    name: 'small-dots',
    payload,
    matrixOptions,
    styling: {moduleSize: 6, modules: circle({size: 0.7})},
  },
  {
    name: 'custom-shapes',
    payload,
    matrixOptions,
    styling: {
      moduleSize: 6,
      modules: customModules,
      finder: finder({ring: customParts, center: customParts}),
      alignment: alignment({ring: customParts, center: customParts}),
    },
  },
  {
    name: 'translucent-colors',
    payload,
    matrixOptions,
    styling: {moduleSize: 4, foreground: '#1e3a8acc', background: '#ffffffb3'},
  },
  {
    name: 'transparent-background',
    payload,
    matrixOptions,
    styling: {moduleSize: 4, foreground: '#0f172a', background: '#ffffff00', modules: rounded()},
  },
];
