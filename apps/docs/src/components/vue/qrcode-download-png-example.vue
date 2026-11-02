<script setup lang="ts">
import {QRCodePNG, type QRCodeDownloadHandle, type QRCodePNGImageOptions} from '@qrcodesdk/vue';
import {ref} from 'vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
const options: QRCodePNGImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <QRCodePNG ref="qrcode" payload="https://qrcodesdk.dev" :options="options" />
    <button class="btn-primary" type="button" @click="qrcode?.download('qrcodesdk')">
      Download PNG
    </button>
  </div>
</template>
