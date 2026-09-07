import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {type QRCodeSVGOptions, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';
import {forwardRef, useImperativeHandle, useMemo} from 'react';

import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';
import {splitOptions} from './split-options';

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;

export const QRCodeSVG = forwardRef<QRCodeDownloadHandle, QRCodeSVGProps>(function QRCodeSVG(
  {payload, options, ...wrapperProps},
  ref,
) {
  const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
  const svgRenderer = useMemo(() => QRCodeSVGRenderer(rendererOptions), [rendererOptions]);
  const svg = useMemo(
    () => qrcode(payload).options(matrixOptions).render(svgRenderer),
    [payload, matrixOptions, svgRenderer],
  );

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        qrcode(payload)
          .options(matrixOptions)
          .render(
            QRCodeDownloadSVGRenderer({
              renderer: svgRenderer,
              filename,
            }),
          );
      },
    }),
    [payload, matrixOptions, svgRenderer],
  );

  return <div {...wrapperProps} dangerouslySetInnerHTML={{__html: svg}} />;
});
