<script lang="ts">
  import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
  import {qrcode} from '@qrcodesdk/core';

  import type {QRCodeCanvasProps} from './types.js';
  import {splitOptions} from './split-options.js';

  let {payload, options, ...attributes}: QRCodeCanvasProps = $props();
  let container = $state<HTMLDivElement>();

  const resolvedOptions = $derived(splitOptions(options));
  const canvasRenderer = $derived(QRCodeCanvasRenderer(resolvedOptions[1]));

  $effect(() => {
    if (!container) return;

    container.replaceChildren(qrcode(payload).options(resolvedOptions[0]).render(canvasRenderer));
  });
</script>

<div bind:this={container} {...attributes}></div>
