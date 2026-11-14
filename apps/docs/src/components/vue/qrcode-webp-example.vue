<script setup lang="ts">
import {QRCodeWebP, type QRCodeWebPImageOptions} from '@qrcodesdk/vue';

const options: QRCodeWebPImageOptions = {
  style: {moduleSize: 8, quietZone: 4},
  accessibility: {
    alt: 'QR code: scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeWebP payload="https://qrcodesdk.dev" :options="options" />
</template>
