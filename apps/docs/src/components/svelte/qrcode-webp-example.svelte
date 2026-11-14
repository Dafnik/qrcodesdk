<script lang="ts">
  import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeWebPImageOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeWebP payload="https://qrcodesdk.dev" {options} />
