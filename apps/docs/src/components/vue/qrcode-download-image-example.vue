<script setup lang="ts">
import type {QRCodeImageOptions} from '@qrcodesdk/browser';
import {QRCodeImage, type QRCodeDownloadHandle} from '@qrcodesdk/vue';
import {ref} from 'vue';

const qrcode = ref<QRCodeDownloadHandle | null>(null);
const options: QRCodeImageOptions = {accessibility: {alt: 'QR code for qrcodesdk.dev'}};
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <QRCodeImage ref="qrcode" data="https://qrcodesdk.dev" :options="options" />
    <button class="btn-primary" type="button" @click="qrcode?.download('qrcodesdk')">
      Download PNG
    </button>
  </div>
</template>
