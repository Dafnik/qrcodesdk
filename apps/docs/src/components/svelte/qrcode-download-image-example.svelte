<script lang="ts">
  import {QRCodeImage, type QRCodeDownloadHandle, type QRCodeImageOptions} from '@qrcodesdk/svelte';

  let qrcode: QRCodeDownloadHandle | undefined;
  const options: QRCodeImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<div class="flex flex-col items-center gap-2">
  <QRCodeImage bind:this={qrcode} payload="https://qrcodesdk.dev" {options} />
  <button class="btn-primary" type="button" onclick={() => qrcode?.download('qrcodesdk')}>
    Download PNG
  </button>
</div>
