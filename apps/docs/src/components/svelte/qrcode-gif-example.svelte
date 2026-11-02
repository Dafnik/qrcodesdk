<script lang="ts">
  import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeGIFImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeGIF class="mx-auto" payload="https://qrcodesdk.dev" {options} />
