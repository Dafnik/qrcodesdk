<script lang="ts">
  import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
  import {qrcode} from '@qrcodesdk/core';

  import type {QRCodeCanvasProps} from './types.js';

  let {data, options, ...attributes}: QRCodeCanvasProps = $props();
  let container = $state<HTMLDivElement>();

  const canvasRenderer = $derived(QRCodeCanvasRenderer(options));

  $effect(() => {
    if (!container) return;

    container.replaceChildren(qrcode(data).config(options).render(canvasRenderer));
  });
</script>

<div bind:this={container} {...attributes}></div>
