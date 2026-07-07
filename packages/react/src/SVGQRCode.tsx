import {DownloadSVGQRCodeRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeMatrixOptions,
  type QRCodeSVGRendererOptions,
  SVGQRCodeRenderer,
} from '@qrcodesdk/core';
import {forwardRef, useImperativeHandle, useMemo} from 'react';

import {renderQRCode} from './qrcode-builder';
import type {QRCodeBaseProps} from './types';

export type QRCodeSVGOptions = QRCodeMatrixOptions & QRCodeSVGRendererOptions;

export type SVGQRCodeHandle = {
  download(filename?: string): void;
};

export type SVGQRCodeProps = QRCodeBaseProps<QRCodeSVGOptions>;

export const SVGQRCode = forwardRef<SVGQRCodeHandle, SVGQRCodeProps>(function SVGQRCode(
  {data, options, className},
  ref,
) {
  const svgRenderer = useMemo(() => SVGQRCodeRenderer(options), [options]);
  const svg = useMemo(() => renderQRCode(data, options, svgRenderer), [data, options, svgRenderer]);

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        renderQRCode(
          data,
          options,
          DownloadSVGQRCodeRenderer({
            renderer: svgRenderer,
            filename,
          }),
        );
      },
    }),
    [data, options, svgRenderer],
  );

  return <div className={className} dangerouslySetInnerHTML={{__html: svg}} />;
});

export const QRCodeSVGContainer = SVGQRCode;
