<script lang="ts">
  import {QRCodeWebPImageRenderer} from '@qrcodesdk/browser/webp';

  import QRCodeImageBase from './QRCodeImageBase.svelte';
  import type {QRCodeDownloadHandle, QRCodeWebPProps} from './types.js';

  let props: QRCodeWebPProps = $props();
  let image = $state<QRCodeDownloadHandle>();

  export function download(filename = '') {
    image?.download(filename);
  }
</script>

<QRCodeImageBase bind:this={image} {...props} createRenderer={QRCodeWebPImageRenderer} />
