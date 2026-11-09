<script lang="ts">
  import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeCanvas payload="https://qrcodesdk.dev" {options} />
