import {QRCodeCanvasRenderer, type QRCodeCanvasRendererOptions} from '@qrcodesdk/browser';
import {type QRCodeMatrixOptions} from '@qrcodesdk/core';
import {useEffect, useMemo, useRef} from 'react';

import {replaceElementChildren} from './replace-children';
import type {QRCodeBaseProps} from './types';
import {qrcode} from '@qrcodesdk/core';

export type QRCodeCanvasOptions = QRCodeMatrixOptions & QRCodeCanvasRendererOptions;

export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export function QRCodeCanvas({data, options, className}: QRCodeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRenderer = useMemo(() => QRCodeCanvasRenderer(options), [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    replaceElementChildren(container, qrcode(data).config(options).render(canvasRenderer));
  }, [canvasRenderer, data, options]);

  return <div className={className} ref={containerRef} />;
}
