<script lang="ts" generics="TOptions extends {readonly matrix?: QRCodeMatrixOptions}">
  import {QRCodeDownloadImageRenderer} from '@qrcodesdk/browser/image';
  import {type QRCodeMatrixOptions, type QRCodeRenderer, qrcode} from '@qrcodesdk/core';

  import type {QRCodeBaseProps} from './types.js';
  import {splitOptions} from './split-options.js';

  type Props = QRCodeBaseProps<TOptions> & {
    createRenderer: (options?: Omit<TOptions, 'matrix'>) => QRCodeRenderer<HTMLImageElement>;
  };

  // Shared by the image components, so each format loads only its own encoder.
  let {payload, options, createRenderer, ...attributes}: Props = $props();
  let container = $state<HTMLDivElement>();

  const resolvedOptions = $derived(splitOptions(options));
  const imageRenderer = $derived(createRenderer(resolvedOptions[1]));

  $effect(() => {
    if (!container) return;

    container.replaceChildren(qrcode(payload).options(resolvedOptions[0]).render(imageRenderer));
  });

  export function download(filename = '') {
    if (typeof document === 'undefined') return;

    qrcode(payload)
      .options(resolvedOptions[0])
      .render(QRCodeDownloadImageRenderer({renderer: imageRenderer, filename}));
  }
</script>

<div bind:this={container} {...attributes}></div>
