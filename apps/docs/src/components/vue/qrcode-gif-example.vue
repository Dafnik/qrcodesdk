<script setup lang="ts">
import {QRCodeGIF, type QRCodeGIFImageOptions} from '@qrcodesdk/vue';

const options: QRCodeGIFImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeGIF payload="https://qrcodesdk.dev" :options="options" />
</template>
