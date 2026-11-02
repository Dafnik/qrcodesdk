<script lang="ts">
  import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';

  import QRCodeImageBase from './QRCodeImageBase.svelte';
  import type {QRCodeDownloadHandle, QRCodePNGProps} from './types.js';

  let {...props}: QRCodePNGProps = $props();
  let image = $state<QRCodeDownloadHandle>();

  export function download(filename = '') {
    image?.download(filename);
  }
</script>

<QRCodeImageBase bind:this={image} {...props} createRenderer={QRCodePNGImageRenderer} />
