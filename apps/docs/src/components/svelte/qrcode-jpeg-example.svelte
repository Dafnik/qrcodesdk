<script lang="ts">
  import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeJPEGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    quality: 90,
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeJPEG payload="https://qrcodesdk.dev" {options} />
