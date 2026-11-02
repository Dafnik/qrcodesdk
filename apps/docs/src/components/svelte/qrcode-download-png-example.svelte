<script lang="ts">
  import {
    QRCodePNG,
    type QRCodeDownloadHandle,
    type QRCodePNGImageOptions,
  } from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
  const options: QRCodePNGImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<div class="flex flex-col items-center gap-2">
  <QRCodePNG bind:this={qrcode} payload="https://qrcodesdk.dev" {options} />
  <button class="btn-primary" type="button" onclick={() => qrcode?.download('qrcodesdk')}>
    Download PNG
  </button>
</div>
