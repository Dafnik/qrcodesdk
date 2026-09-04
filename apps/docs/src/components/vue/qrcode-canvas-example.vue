<script setup lang="ts">
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {QRCodeCanvas} from '@qrcodesdk/vue';

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
  <QRCodeCanvas data="https://qrcodesdk.dev" :options="options" />
</template>
