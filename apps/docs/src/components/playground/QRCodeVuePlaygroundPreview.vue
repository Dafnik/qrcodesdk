<script setup lang="ts">
import {useStore} from '@nanostores/vue';
import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '@qrcodesdk/vue';
import {computed, ref} from 'vue';

import {
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundConfig,
  playgroundPreparedImage,
} from './playground-config.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

const config = useStore(playgroundConfig);
const preparedImage = useStore(playgroundPreparedImage);
const svgQRCode = ref<QRCodeDownloadHandle | null>(null);
const imageQRCode = ref<QRCodeDownloadHandle | null>(null);
const error = computed(() => hasQRCodeError(config.value, preparedImage.value));
const svgOptions = computed(() => createPlaygroundSVGOptions(config.value, preparedImage.value));
const imageOptions = computed(() =>
  createPlaygroundImageOptions(config.value, preparedImage.value),
);
const canvasOptions = computed(() =>
  createPlaygroundCanvasOptions(config.value, preparedImage.value),
);
</script>

<template>
  <div :data-active="config.packageName === 'vue'">
    <div
      class="flex flex-col items-center justify-center gap-4"
      v-if="config.packageName === 'vue'">
      <div
        class="group/alert text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 relative grid w-full max-w-md gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18"
        v-if="error">
        <h4
          class="[&_a]:hover:text-foreground font-medium [&_a]:underline [&_a]:underline-offset-3">
          QR code generation failed
        </h4>
        <p
          class="text-destructive/90 [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
          {{ String(error || 'This QR code configuration is invalid.') }}
        </p>
      </div>

      <template v-else-if="config.output === 'svg'">
        <QRCodeSVG ref="svgQRCode" :data="config.data" :options="svgOptions" />
        <button
          class="btn-primary large min-w-64"
          type="button"
          @click="svgQRCode?.download('qrcodesdk')">
          Download SVG
        </button>
      </template>

      <template v-else-if="config.output === 'image'">
        <QRCodeImage ref="imageQRCode" :data="config.data" :options="imageOptions" />
        <button
          class="btn-primary large min-w-64"
          type="button"
          @click="imageQRCode?.download('qrcodesdk')">
          Download PNG
        </button>
      </template>

      <QRCodeCanvas v-else :data="config.data" :options="canvasOptions" />
    </div>
  </div>
</template>
