<script lang="ts">
  import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodePNGImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodePNG class="mx-auto" payload="https://qrcodesdk.dev" {options} />
