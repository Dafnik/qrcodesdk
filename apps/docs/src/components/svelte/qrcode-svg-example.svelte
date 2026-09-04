<script lang="ts">
  import type {QRCodeSVGOptions} from '@qrcodesdk/core';
  import {QRCodeSVG} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    style: {moduleSize: 8, quietZone: 2},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeSVG class="mx-auto" data="https://qrcodesdk.dev" {options} />
