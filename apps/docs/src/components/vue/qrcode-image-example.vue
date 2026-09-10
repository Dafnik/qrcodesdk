<script setup lang="ts">
import {QRCodeImage, type QRCodeImageOptions} from '@qrcodesdk/vue';

const options: QRCodeImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeImage payload="https://qrcodesdk.dev" :options="options" />
</template>
