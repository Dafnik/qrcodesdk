<script lang="ts">
  import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
  import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

  import type {QRCodeSVGProps} from './types.js';
  import {splitOptions} from './split-options.js';

  let {data, options, ...attributes}: QRCodeSVGProps = $props();

  const resolvedOptions = $derived(splitOptions(options));
  const svgRenderer = $derived(QRCodeSVGRenderer(resolvedOptions[1]));
  const svg = $derived(qrcode(data).config(resolvedOptions[0]).render(svgRenderer));

  export function download(filename = '') {
    if (typeof document === 'undefined') return;

    qrcode(data)
      .config(resolvedOptions[0])
      .render(QRCodeDownloadSVGRenderer({renderer: svgRenderer, filename: filename || undefined}));
  }
</script>

<div {...attributes}>{@html svg}</div>
