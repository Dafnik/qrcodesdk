import {CanvasQRCodeRenderer, type QRCodeCanvasRendererOptions} from '@qrcodesdk/browser';
import {type QRCodeMatrixOptions} from '@qrcodesdk/core';
import {useEffect, useMemo, useRef} from 'react';

import {renderQRCode} from './qrcode-builder';
import {replaceElementChildren} from './replace-children';
import type {QRCodeBaseProps} from './types';

export type QRCodeCanvasOptions = QRCodeMatrixOptions & QRCodeCanvasRendererOptions;

export type CanvasQRCodeProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export function CanvasQRCode({data, options, className}: CanvasQRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRenderer = useMemo(() => CanvasQRCodeRenderer(options), [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    replaceElementChildren(container, renderQRCode(data, options, canvasRenderer));
  }, [canvasRenderer, data, options]);

  return <div className={className} ref={containerRef} />;
}
