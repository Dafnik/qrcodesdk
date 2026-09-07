import {
  QRCodeDownloadImageRenderer,
  type QRCodeImageOptions,
  QRCodeImageRenderer,
} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef} from 'react';

import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';
import {splitOptions} from './split-options';

export type QRCodeImageProps = QRCodeBaseProps<QRCodeImageOptions>;

export const QRCodeImage = forwardRef<QRCodeDownloadHandle, QRCodeImageProps>(function QRCodeImage(
  {payload, options, ...wrapperProps},
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
  const imageRenderer = useMemo(() => QRCodeImageRenderer(rendererOptions), [rendererOptions]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren(qrcode(payload).options(matrixOptions).render(imageRenderer));
  }, [payload, imageRenderer, matrixOptions]);

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        qrcode(payload)
          .options(matrixOptions)
          .render(
            QRCodeDownloadImageRenderer({
              renderer: imageRenderer,
              filename,
            }),
          );
      },
    }),
    [payload, imageRenderer, matrixOptions],
  );

  return <div {...wrapperProps} ref={containerRef} />;
});
