<script lang="ts">
  import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeJPEGImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    quality: 90,
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeJPEG class="mx-auto" payload="https://qrcodesdk.dev" {options} />
