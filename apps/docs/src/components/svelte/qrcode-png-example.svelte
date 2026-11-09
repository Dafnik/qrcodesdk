<script lang="ts">
  import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodePNGImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodePNG payload="https://qrcodesdk.dev" {options} />
