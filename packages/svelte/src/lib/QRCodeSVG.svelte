<script lang="ts">
  import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
  import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

  import type {QRCodeSVGProps} from './types.js';

  let {data, options, ...attributes}: QRCodeSVGProps = $props();

  const svgRenderer = $derived(QRCodeSVGRenderer(options));
  const svg = $derived(qrcode(data).config(options).render(svgRenderer));

  export function download(filename = '') {
    if (typeof document === 'undefined') return;

    qrcode(data)
      .config(options)
      .render(QRCodeDownloadSVGRenderer({renderer: svgRenderer, filename: filename || undefined}));
  }
</script>

<div {...attributes}>{@html svg}</div>
