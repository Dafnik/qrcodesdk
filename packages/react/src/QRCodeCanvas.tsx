import {type QRCodeCanvasOptions, QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';
import {useEffect, useMemo, useRef} from 'react';

import type {QRCodeBaseProps} from './types';

export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export function QRCodeCanvas({data, options, ...wrapperProps}: QRCodeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRenderer = useMemo(() => QRCodeCanvasRenderer(options), [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren(qrcode(data).config(options).render(canvasRenderer));
  }, [canvasRenderer, data, options]);

  return <div {...wrapperProps} ref={containerRef} />;
}
