<script setup lang="ts">
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/vue';

const options: QRCodeSVGOptions = {
  accessibility: {
    title: 'QR code for qrcodesdk.dev',
    ariaLabel: 'Scan to open qrcodesdk.dev',
  },
};
</script>

<template>
  <QRCodeSVG payload="https://qrcodesdk.dev" :options="options" />
</template>
