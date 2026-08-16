<script lang="ts">
  import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
  import {QRCodeCanvas} from '@qrcodesdk/svelte';

  const options: QRCodeCanvasOptions = {size: 8, margin: 2};
</script>

<QRCodeCanvas class="mx-auto" data="https://qrcodesdk.dev" {options} />
