<script lang="ts">
  import {QRCodeCanvas, QRCodeImage, QRCodeSVG, type QRCodeDownloadHandle} from '@qrcodesdk/svelte';

  import {
    createPlaygroundCanvasOptions,
    createPlaygroundImageOptions,
    createPlaygroundSVGOptions,
    playgroundOptions,
    playgroundPreparedImage,
  } from './playground-options.ts';
  import {hasQRCodeError} from './qrcode-error-checker.ts';

  let svgQRCode: QRCodeDownloadHandle | undefined;
  let imageQRCode: QRCodeDownloadHandle | undefined;
  const error = $derived(hasQRCodeError($playgroundOptions, $playgroundPreparedImage));
  const svgOptions = $derived(
    createPlaygroundSVGOptions($playgroundOptions, $playgroundPreparedImage),
  );
  const imageOptions = $derived(
    createPlaygroundImageOptions($playgroundOptions, $playgroundPreparedImage),
  );
  const canvasOptions = $derived(
    createPlaygroundCanvasOptions($playgroundOptions, $playgroundPreparedImage),
  );
</script>

<div data-active={$playgroundOptions.packageName === 'svelte'}>
  {#if $playgroundOptions.packageName === 'svelte'}
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
            {String(error || 'This QR code options is invalid.')}
          </p>
        </div>
      {:else if $playgroundOptions.output === 'svg'}
        <QRCodeSVG
          bind:this={svgQRCode}
          payload={$playgroundOptions.payload}
          options={svgOptions} />
        <button
          class="btn-primary large min-w-64"
          type="button"
          onclick={() => svgQRCode?.download('qrcodesdk')}>
          Download SVG
        </button>
      {:else if $playgroundOptions.output === 'image'}
        <QRCodeImage
          bind:this={imageQRCode}
          payload={$playgroundOptions.payload}
          options={imageOptions} />
        <button
          class="btn-primary large min-w-64"
          type="button"
          onclick={() => imageQRCode?.download('qrcodesdk')}>
          Download PNG
        </button>
      {:else}
        <QRCodeCanvas payload={$playgroundOptions.payload} options={canvasOptions} />
      {/if}
    </div>
  {/if}
</div>
