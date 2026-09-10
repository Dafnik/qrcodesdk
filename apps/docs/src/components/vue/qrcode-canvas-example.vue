<script setup lang="ts">
import {QRCodeCanvas, type QRCodeCanvasOptions} from '@qrcodesdk/vue';

const options: QRCodeCanvasOptions = {
  style: {
    moduleSize: 8,
    quietZone: 4,
    foreground: '#111827',
    background: '#ffffff',
  },
};
</script>

<template>
  <QRCodeCanvas payload="https://qrcodesdk.dev" :options="options" />
</template>
