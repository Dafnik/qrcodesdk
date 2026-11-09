<script lang="ts">
  import {
    QRCodePNG,
    type QRCodeDownloadHandle,
    type QRCodePNGImageOptions,
  } from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
  const options: QRCodePNGImageOptions = {
    accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
  };
</script>

<QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" {options} />
<button type="button" onclick={() => qrcode?.download('qrcodesdk')}>Download PNG</button>
