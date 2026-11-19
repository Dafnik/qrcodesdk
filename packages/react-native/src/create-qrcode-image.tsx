import {
  type QRCodeMatrix,
  type QRCodeMatrixOptions,
  type QRCodeVisualStyle,
  qrcode,
} from '@qrcodesdk/core';
import {
  type ɵRGBAImage as RGBAImage,
  ɵcreateRGBARenderer as createRGBARenderer,
} from '@qrcodesdk/core/internal/raster';
import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import {Image, View} from 'react-native';

import {accessibilityProps} from './accessibility';
import {encodeBase64} from './base64';
import {type QRCodeRasterCenterImage, rasterCenterImages} from './center-image';
import {splitOptions} from './split-options';
import type {QRCodeImageAccessibilityOptions, QRCodeImageHandle, QRCodeImageProps} from './types';

/** Options shared by the PNG, WebP, GIF, and JPEG components. */
export type QRCodeImageOptions = {
  readonly matrix?: QRCodeMatrixOptions;
  readonly style?: QRCodeVisualStyle;
  readonly accessibility?: QRCodeImageAccessibilityOptions;
  readonly centerImage?: QRCodeRasterCenterImage;
};

type EncodedImage = {readonly uri: string; readonly width: number; readonly height: number};

/**
 * Creates an image component for one image format. The component draws the pixels in JavaScript,
 * encodes them, and shows them as a base64 `data:` URL.
 */
export function createQRCodeImageComponent<TOptions extends QRCodeImageOptions>(
  displayName: string,
  mimeType: string,
  createEncoder: (
    options: Omit<TOptions, 'matrix'> | undefined,
  ) => (image: RGBAImage) => Uint8Array,
): ForwardRefExoticComponent<QRCodeImageProps<TOptions> & RefAttributes<QRCodeImageHandle>> {
  const component = forwardRef<QRCodeImageHandle, QRCodeImageProps<TOptions>>(function QRCodeImage(
    {payload, options, onLoad, ...viewProps},
    ref,
  ) {
    const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
    const render = useMemo(() => {
      const draw = createRGBARenderer(
        rendererOptions?.style,
        rasterCenterImages.resolve(rendererOptions?.centerImage),
      );
      const encode = createEncoder(rendererOptions);
      return (matrix: QRCodeMatrix): EncodedImage => {
        const image = draw(matrix);
        return {
          uri: `data:${mimeType};base64,${encodeBase64(encode(image))}`,
          width: image.width,
          height: image.height,
        };
      };
    }, [rendererOptions]);
    const image = useMemo(
      () => qrcode(payload).options(matrixOptions).render(render),
      [payload, matrixOptions, render],
    );

    useImperativeHandle(ref, () => ({toDataURL: () => image.uri}), [image]);

    return (
      <View {...accessibilityProps(rendererOptions?.accessibility?.ariaLabel)} {...viewProps}>
        <Image
          onLoad={onLoad}
          source={{uri: image.uri, width: image.width, height: image.height}}
          style={{width: image.width, height: image.height}}
        />
      </View>
    );
  });
  component.displayName = displayName;
  return component;
}
