<script lang="ts">
  import {QRCodeGIFImageRenderer} from '@qrcodesdk/browser/gif';

  import QRCodeImageBase from './QRCodeImageBase.svelte';
  import type {QRCodeDownloadHandle, QRCodeGIFProps} from './types.js';

  let {...props}: QRCodeGIFProps = $props();
  let image = $state<QRCodeDownloadHandle>();

  export function download(filename = '') {
    image?.download(filename);
  }
</script>

<QRCodeImageBase bind:this={image} {...props} createRenderer={QRCodeGIFImageRenderer} />
