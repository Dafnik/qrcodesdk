import {
  QRCodeDownloadImageRenderer,
  type QRCodeImageOptions,
  QRCodeImageRenderer,
} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef} from 'react';

import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';

export type QRCodeImageProps = QRCodeBaseProps<QRCodeImageOptions>;

export const QRCodeImage = forwardRef<QRCodeDownloadHandle, QRCodeImageProps>(function QRCodeImage(
  {data, options, ...wrapperProps},
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRenderer = useMemo(() => QRCodeImageRenderer(options), [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren(qrcode(data).config(options).render(imageRenderer));
  }, [data, imageRenderer, options]);

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        qrcode(data)
          .config(options)
          .render(
            QRCodeDownloadImageRenderer({
              renderer: imageRenderer,
              filename,
            }),
          );
      },
    }),
    [data, imageRenderer, options],
  );

  return <div {...wrapperProps} ref={containerRef} />;
});
