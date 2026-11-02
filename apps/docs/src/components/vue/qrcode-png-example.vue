<script setup lang="ts">
import {QRCodePNG, type QRCodePNGImageOptions} from '@qrcodesdk/vue';

const options: QRCodePNGImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodePNG payload="https://qrcodesdk.dev" :options="options" />
</template>
