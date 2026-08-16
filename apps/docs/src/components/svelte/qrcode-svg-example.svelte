<script lang="ts">
  import type {QRCodeSVGOptions} from '@qrcodesdk/core';
  import {QRCodeSVG} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    size: 8,
    margin: 2,
    ariaLabel: 'Scan to open qrcodesdk.dev',
  };
</script>

<QRCodeSVG class="mx-auto" data="https://qrcodesdk.dev" {options} />
