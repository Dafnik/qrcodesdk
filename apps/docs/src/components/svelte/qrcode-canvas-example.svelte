<script lang="ts">
  import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {style: {moduleSize: 8, quietZone: 2}};
</script>

<QRCodeCanvas class="mx-auto" payload="https://qrcodesdk.dev" {options} />
