<script setup lang="ts">
import {QRCodePNG, type QRCodeDownloadHandle, type QRCodePNGImageOptions} from '@qrcodesdk/vue';
import {ref} from 'vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
const options: QRCodePNGImageOptions = {
  accessibility: {alt: 'QR code: scan to open qrcodesdk.dev'},
};
</script>

<template>
  <QRCodePNG ref="qrcode" payload="https://qrcodesdk.dev" :options="options" />
  <button type="button" @click="qrcode?.download('qrcodesdk')">Download PNG</button>
</template>
