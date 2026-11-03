<script lang="ts">
  import {QRCodeJPEGImageRenderer} from '@qrcodesdk/browser/jpeg';

  import QRCodeImageBase from './QRCodeImageBase.svelte';
  import type {QRCodeDownloadHandle, QRCodeJPEGProps} from './types.js';

  let {...props}: QRCodeJPEGProps = $props();
  let image = $state<QRCodeDownloadHandle>();

  export function download(filename = '') {
    image?.download(filename);
  }
</script>

<QRCodeImageBase bind:this={image} {...props} createRenderer={QRCodeJPEGImageRenderer} />
