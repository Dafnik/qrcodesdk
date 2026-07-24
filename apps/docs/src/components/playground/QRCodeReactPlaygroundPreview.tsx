import {useMemo, useRef} from 'react';

import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

import {useStore} from '@nanostores/react';
import {qrConfig} from './playground-config.ts';

export default function QRCodeReactPlaygroundPreview() {
  const config = useStore(qrConfig);

  const svgRef = useRef<QRCodeDownloadHandle>(null);
  const imageRef = useRef<QRCodeDownloadHandle>(null);

  const content = useMemo(() => {
    if (config.packageName !== 'react') return null;
    // if (!snapshot.config) return <PreviewError message={snapshot.validation.error} />;

    if (config.output === 'svg') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeSVG ref={svgRef} data={config.value} options={config} />
          <DownloadButton
            label="Download SVG"
            onClick={() => svgRef.current?.download('qrcodesdk')}
          />
        </div>
      );
    }

    if (config.output === 'image') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeImage ref={imageRef} data={config.value} options={config} />
          <DownloadButton
            label="Download PNG"
            onClick={() => imageRef.current?.download('qrcodesdk')}
          />
        </div>
      );
    }

    return <QRCodeCanvas data={config.value} options={config} />;
  }, [config]);

  return <div data-active={config.packageName === 'react'}>{content}</div>;
}

function DownloadButton({label, onClick}: {label: string; onClick(): void}) {
  return (
    <button
      className="focus-visible:border-ring focus-visible:ring-ring/50 data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 group/button bg-primary text-primary-foreground [a]:hover:bg-primary/80 inline-flex h-9 min-w-64 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3 data-disabled:pointer-events-none data-disabled:opacity-50 data-[matches-spartan-invalid=true]:ring-3 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]"
      type="button"
      onClick={onClick}>
      {label}
    </button>
  );
}

function PreviewError({message}: {message?: string}) {
  return (
    <div className="qrcode-playground__preview-error" role="status">
      {message ?? 'This QR code configuration is invalid.'}
    </div>
  );
}
