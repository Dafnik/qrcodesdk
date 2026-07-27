import {useMemo, useRef} from 'react';

import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

import {useStore} from '@nanostores/react';
import {playgroundConfig} from './playground-config.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

export default function QRCodeReactPlaygroundPreview() {
  const config = useStore(playgroundConfig);

  const svgRef = useRef<QRCodeDownloadHandle>(null);
  const imageRef = useRef<QRCodeDownloadHandle>(null);

  const content = useMemo(() => {
    if (config.packageName !== 'react') return null;
    const hasError = hasQRCodeError(config);
    if (hasError) return <PreviewError message={hasError} />;

    if (config.output === 'svg') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeSVG ref={svgRef} data={config.data} options={config} />
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
          <QRCodeImage ref={imageRef} data={config.data} options={config} />
          <DownloadButton
            label="Download PNG"
            onClick={() => imageRef.current?.download('qrcodesdk')}
          />
        </div>
      );
    }

    return <QRCodeCanvas data={config.data} options={config} />;
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

function PreviewError({message}: {message?: unknown}) {
  return (
    <div className="group/alert text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 relative grid w-full max-w-md gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18 has-[>ng-icon]:grid-cols-[auto_1fr] has-[>ng-icon]:gap-x-2 *:[ng-icon]:row-span-2 *:[ng-icon]:translate-y-0.5 *:[ng-icon]:text-current *:[ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]">
      <h4 className="[&_a]:hover:text-foreground font-medium group-has-[>ng-icon]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3">
        QR code generation failed
      </h4>
      <p className="text-destructive/90 [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
        {message ? String(message) : 'This QR code configuration is invalid.'}
      </p>
    </div>
  );
}
