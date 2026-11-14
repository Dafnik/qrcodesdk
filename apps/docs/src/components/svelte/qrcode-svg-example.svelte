<script lang="ts">
  import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/svelte';

  const options: QRCodeSVGOptions = {
    style: {moduleSize: 8, quietZone: 4},
    accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
  };
</script>

<QRCodeSVG payload="https://qrcodesdk.dev" {options} />
