<script lang="ts">
  import type {QRCodeImageOptions} from '@qrcodesdk/browser';
  import {QRCodeImage} from '@qrcodesdk/svelte';

  const options: QRCodeImageOptions = {
    size: 8,
    margin: 2,
    alt: 'QR code for qrcodesdk.dev',
  };
</script>

<QRCodeImage class="mx-auto" data="https://qrcodesdk.dev" {options} />
