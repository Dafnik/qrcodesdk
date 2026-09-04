<script lang="ts">
  import {QRCodeDownloadImageRenderer, QRCodeImageRenderer} from '@qrcodesdk/browser';
  import {qrcode} from '@qrcodesdk/core';

  import type {QRCodeImageProps} from './types.js';
  import {splitOptions} from './split-options.js';

  let {data, options, ...attributes}: QRCodeImageProps = $props();
  let container = $state<HTMLDivElement>();

  const resolvedOptions = $derived(splitOptions(options));
  const imageRenderer = $derived(QRCodeImageRenderer(resolvedOptions[1]));

  $effect(() => {
    if (!container) return;

    container.replaceChildren(qrcode(data).config(resolvedOptions[0]).render(imageRenderer));
  });

  export function download(filename = '') {
    if (typeof document === 'undefined') return;

    qrcode(data)
      .config(resolvedOptions[0])
      .render(
        QRCodeDownloadImageRenderer({renderer: imageRenderer, filename: filename || undefined}),
      );
  }
</script>

<div bind:this={container} {...attributes}></div>
