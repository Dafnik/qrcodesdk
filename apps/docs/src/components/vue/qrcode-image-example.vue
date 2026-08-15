<script setup lang="ts">
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {QRCodeImage} from '@qrcodesdk/vue';

const options: QRCodeImageOptions = {
  size: 8,
  margin: 4,
  alt: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
};
</script>

<template>
  <QRCodeImage data="https://qrcodesdk.dev" :options />
</template>
