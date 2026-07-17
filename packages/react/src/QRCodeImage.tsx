import {
  QRCodeDownloadImageRenderer,
  type QRCodeImageOptions,
  QRCodeImageRenderer,
} from '@qrcodesdk/browser';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef} from 'react';

import {replaceElementChildren} from './replace-children';
import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';
import {qrcode} from '@qrcodesdk/core';

export type QRCodeImageProps = QRCodeBaseProps<QRCodeImageOptions>;

export const QRCodeImage = forwardRef<QRCodeDownloadHandle, QRCodeImageProps>(function QRCodeImage(
  {data, options, className},
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRenderer = useMemo(() => QRCodeImageRenderer(options), [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    replaceElementChildren(container, qrcode(data).config(options).render(imageRenderer));
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

  return <div className={className} ref={containerRef} />;
});
