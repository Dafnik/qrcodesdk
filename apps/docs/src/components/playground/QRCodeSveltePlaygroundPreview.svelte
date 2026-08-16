<script lang="ts">
  import {QRCodeCanvas, QRCodeImage, QRCodeSVG, type QRCodeDownloadHandle} from '@qrcodesdk/svelte';

  import {
    createPlaygroundCanvasOptions,
    createPlaygroundImageOptions,
    createPlaygroundSVGOptions,
    playgroundConfig,
    playgroundPreparedImage,
  } from './playground-config.ts';
  import {hasQRCodeError} from './qrcode-error-checker.ts';

  let svgQRCode: QRCodeDownloadHandle | undefined;
  let imageQRCode: QRCodeDownloadHandle | undefined;
  const error = $derived(hasQRCodeError($playgroundConfig, $playgroundPreparedImage));
  const svgOptions = $derived(
    createPlaygroundSVGOptions($playgroundConfig, $playgroundPreparedImage),
  );
  const imageOptions = $derived(
    createPlaygroundImageOptions($playgroundConfig, $playgroundPreparedImage),
  );
  const canvasOptions = $derived(
    createPlaygroundCanvasOptions($playgroundConfig, $playgroundPreparedImage),
  );
</script>

<div data-active={$playgroundConfig.packageName === 'svelte'}>
  {#if $playgroundConfig.packageName === 'svelte'}
    <div class="flex flex-col items-center justify-center gap-4">
      {#if error}
        <div
          class="group/alert text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 relative grid w-full max-w-md gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18">
          <h4
            class="[&_a]:hover:text-foreground font-medium [&_a]:underline [&_a]:underline-offset-3">
            QR code generation failed
          </h4>
          <p
            class="text-destructive/90 [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
            {String(error || 'This QR code configuration is invalid.')}
          </p>
        </div>
      {:else if $playgroundConfig.output === 'svg'}
        <QRCodeSVG bind:this={svgQRCode} data={$playgroundConfig.data} options={svgOptions} />
        <button
          class="btn-primary large min-w-64"
          type="button"
          onclick={() => svgQRCode?.download('qrcodesdk')}>
          Download SVG
        </button>
      {:else if $playgroundConfig.output === 'image'}
        <QRCodeImage bind:this={imageQRCode} data={$playgroundConfig.data} options={imageOptions} />
        <button
          class="btn-primary large min-w-64"
          type="button"
          onclick={() => imageQRCode?.download('qrcodesdk')}>
          Download PNG
        </button>
      {:else}
        <QRCodeCanvas data={$playgroundConfig.data} options={canvasOptions} />
      {/if}
    </div>
  {/if}
</div>
