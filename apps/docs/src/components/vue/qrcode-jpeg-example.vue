<script setup lang="ts">
import {QRCodeJPEG, type QRCodeJPEGImageOptions} from '@qrcodesdk/vue';

const options: QRCodeJPEGImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  quality: 90,
  accessibility: {
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeJPEG payload="https://qrcodesdk.dev" :options="options" />
</template>
