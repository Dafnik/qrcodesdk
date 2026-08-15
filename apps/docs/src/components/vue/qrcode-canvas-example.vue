<script setup lang="ts">
import type {QRCodeCanvasOptions} from '@qrcodesdk/browser';
import {QRCodeCanvas} from '@qrcodesdk/vue';

const options: QRCodeCanvasOptions = {
  size: 8,
  margin: 4,
  colors: {
    colorDark: '#111827',
    colorLight: '#ffffff',
  },
};
</script>

<template>
  <QRCodeCanvas data="https://qrcodesdk.dev" :options="options" />
</template>
