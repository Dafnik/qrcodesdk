import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {type QRCodeSVGOptions, QRCodeSVGRenderer} from '@qrcodesdk/core';
import {forwardRef, useImperativeHandle, useMemo} from 'react';

import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';
import {qrcode} from '@qrcodesdk/core';

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;

export const QRCodeSVG = forwardRef<QRCodeDownloadHandle, QRCodeSVGProps>(function QRCodeSVG(
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
