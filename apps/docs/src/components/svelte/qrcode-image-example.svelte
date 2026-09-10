<script lang="ts">
  import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeImage class="mx-auto" payload="https://qrcodesdk.dev" {options} />
