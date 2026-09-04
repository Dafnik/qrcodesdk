<script lang="ts">
  import type {QRCodeImageOptions} from '@qrcodesdk/browser';
  import {QRCodeImage} from '@qrcodesdk/svelte';

  const options: QRCodeImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeImage class="mx-auto" data="https://qrcodesdk.dev" {options} />
