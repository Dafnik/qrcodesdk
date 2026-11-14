<script lang="ts">
  import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeGIFImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeGIF payload="https://qrcodesdk.dev" {options} />
