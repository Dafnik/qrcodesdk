<script lang="ts">
  import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/svelte';

  const options: QRCodeWebPImageOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {alt: 'QR code for qrcodesdk.dev'},
  };
</script>

<QRCodeWebP class="mx-auto" payload="https://qrcodesdk.dev" {options} />
