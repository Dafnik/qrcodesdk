import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {type QRCodeSVGOptions, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {forwardRef, useImperativeHandle, useMemo} from 'react';

import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';
import {splitOptions} from './split-options';

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;

export const QRCodeSVG = forwardRef<QRCodeDownloadHandle, QRCodeSVGProps>(function QRCodeSVG(
  {data, options, ...wrapperProps},
  ref,
) {
  const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
  const svgRenderer = useMemo(() => QRCodeSVGRenderer(rendererOptions), [rendererOptions]);
  const svg = useMemo(
    () => qrcode(data).config(matrixOptions).render(svgRenderer),
    [data, matrixOptions, svgRenderer],
  );

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        qrcode(data)
          .config(matrixOptions)
          .render(
            QRCodeDownloadSVGRenderer({
              renderer: svgRenderer,
              filename,
            }),
          );
      },
    }),
    [data, matrixOptions, svgRenderer],
  );

  return <div {...wrapperProps} dangerouslySetInnerHTML={{__html: svg}} />;
});
