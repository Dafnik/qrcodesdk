<script lang="ts">
  import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
  import {QRCodeCanvas} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {style: {moduleSize: 8, quietZone: 2}};
</script>

<QRCodeCanvas class="mx-auto" data="https://qrcodesdk.dev" {options} />
