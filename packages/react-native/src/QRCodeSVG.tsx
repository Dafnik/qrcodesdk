import {
  type QRCodeColor,
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeVisualStyle,
  qrcode,
} from '@qrcodesdk/core';
import {
  ɵcreateQRCodeStyler as createQRCodeStyler,
  ɵtoQRCodePathData as toQRCodePathData,
} from '@qrcodesdk/core/internal';
import {type ReactElement, useMemo} from 'react';
import {View} from 'react-native';
import Svg, {Image, Path} from 'react-native-svg';

import {accessibilityProps} from './accessibility';
import {type QRCodeSVGCenterImage, svgCenterImages} from './center-image';
import {splitOptions} from './split-options';
import type {QRCodeBaseProps, QRCodeSVGAccessibilityOptions} from './types';

export type QRCodeSVGOptions = {
  readonly matrix?: QRCodeMatrixOptions;
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeSVGAccessibilityOptions;
  readonly centerImage?: QRCodeSVGCenterImage;
};
export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;

/** Renders the QR code with react-native-svg. */
export function QRCodeSVG({payload, options, ...viewProps}: QRCodeSVGProps) {
  const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
  const render = useMemo(() => createSVGRenderer(rendererOptions), [rendererOptions]);
  const svg = useMemo(
    () => qrcode(payload).options(matrixOptions).render(render),
    [payload, matrixOptions, render],
  );

  return (
    <View {...accessibilityProps(rendererOptions?.accessibility?.ariaLabel)} {...viewProps}>
      {svg}
    </View>
  );
}

function createSVGRenderer(
  options: Omit<QRCodeSVGOptions, 'matrix'> | undefined,
): (matrix: QRCodeMatrix) => ReactElement {
  const centerImage = svgCenterImages.resolve(options?.centerImage);
  const draw = createQRCodeStyler(options?.style, [centerImage?.part]);

  return function renderSVG(matrix) {
    const drawing = draw(matrix);
    const {viewWidth, viewHeight, outputWidth, outputHeight} = drawing;
    const box = centerImage?.place(drawing);
    return (
      <Svg width={outputWidth} height={outputHeight} viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
        <Path {...fill(drawing.background)} d={`M0 0h${viewWidth}v${viewHeight}H0z`} />
        {drawing.layers.map((layer, index) => (
          <Path key={index} {...fill(layer.color)} fillRule="evenodd" d={toQRCodePathData(layer)} />
        ))}
        {centerImage && box ? (
          <Image
            href={centerImage.source}
            x={box.x}
            y={box.y}
            width={box.size}
            height={box.size}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : null}
      </Svg>
    );
  };
}

function fill(color: QRCodeColor): {fill: string; fillOpacity?: number} {
  return color.length === 9
    ? {fill: color.slice(0, 7), fillOpacity: Number.parseInt(color.slice(7), 16) / 255}
    : {fill: color};
}
