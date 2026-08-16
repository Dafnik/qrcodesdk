<script lang="ts">
  import {QRCodeDownloadImageRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
  import {qrcode} from '@qrcodesdk/core';

  import type {QRCodeImageProps} from './types.js';

  let {data, options, ...attributes}: QRCodeImageProps = $props();
  let container = $state<HTMLDivElement>();

  const imageRenderer = $derived(QRCodeImageRenderer(options));

  $effect(() => {
    if (!container) return;

    container.replaceChildren(qrcode(data).config(options).render(imageRenderer));
  });

  export function download(filename = '') {
    if (typeof document === 'undefined') return;

    qrcode(data)
      .config(options)
      .render(
        QRCodeDownloadImageRenderer({renderer: imageRenderer, filename: filename || undefined}),
      );
  }
</script>

<div bind:this={container} {...attributes}></div>
