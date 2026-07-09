import {DownloadSVGQRCodeRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeMatrixOptions,
  type QRCodeSVGRendererOptions,
  SVGQRCodeRenderer,
} from '@qrcodesdk/core';
import {forwardRef, useImperativeHandle, useMemo} from 'react';

import type {QRCodeBaseProps} from './types';
import {qrcode} from '@qrcodesdk/core';

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
  const svg = useMemo(
    () => qrcode(data).config(options).render(svgRenderer),
    [data, options, svgRenderer],
  );

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        qrcode(data)
          .config(options)
          .render(
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
