import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeMatrixOptions,
  type QRCodeSVGRendererOptions,
  QRCodeSVGRenderer,
} from '@qrcodesdk/core';
import {forwardRef, useImperativeHandle, useMemo} from 'react';

import type {QRCodeBaseProps} from './types';
import {qrcode} from '@qrcodesdk/core';

export type QRCodeSVGOptions = QRCodeMatrixOptions & QRCodeSVGRendererOptions;

export type QRCodeSVGHandle = {
  download(filename?: string): void;
};

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;

export const QRCodeSVG = forwardRef<QRCodeSVGHandle, QRCodeSVGProps>(function QRCodeSVG(
  {data, options, className},
  ref,
) {
  const svgRenderer = useMemo(() => QRCodeSVGRenderer(options), [options]);
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
            QRCodeDownloadSVGRenderer({
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

export const QRCodeSVGContainer = QRCodeSVG;
