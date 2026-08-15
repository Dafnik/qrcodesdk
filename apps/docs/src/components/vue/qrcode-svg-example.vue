<script setup lang="ts">
import type {QRCodeSVGOptions} from '@qrcodesdk/core';
import {QRCodeSVG} from '@qrcodesdk/vue';

const options: QRCodeSVGOptions = {
  title: 'QR code for qrcodesdk.dev',
  ariaLabel: 'Scan to open qrcodesdk.dev',
};
</script>

<template>
  <QRCodeSVG data="https://qrcodesdk.dev" :options="options" />
</template>
