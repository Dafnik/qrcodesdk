<script setup lang="ts">
import {useStore} from '@nanostores/vue';
import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '@qrcodesdk/vue';
import {computed, ref} from 'vue';

import {
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundOptions,
  playgroundPreparedImage,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

const options = useStore(playgroundOptions);
const preparedImage = useStore(playgroundPreparedImage);
const svgQRCode = ref<QRCodeDownloadHandle | null>(null);
const imageQRCode = ref<QRCodeDownloadHandle | null>(null);
const error = computed(() => hasQRCodeError(options.value, preparedImage.value));
const svgOptions = computed(() => createPlaygroundSVGOptions(options.value, preparedImage.value));
const imageOptions = computed(() =>
  createPlaygroundImageOptions(options.value, preparedImage.value),
);
const canvasOptions = computed(() =>
  createPlaygroundCanvasOptions(options.value, preparedImage.value),
);
</script>

<template>
  <div :data-active="options.packageName === 'vue'">
    <div
      class="flex flex-col items-center justify-center gap-4"
      v-if="options.packageName === 'vue'">
      <div
        class="group/alert text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 relative grid w-full max-w-md gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18"
        v-if="error">
        <h4
          class="[&_a]:hover:text-foreground font-medium [&_a]:underline [&_a]:underline-offset-3">
          QR code generation failed
        </h4>
        <p
          class="text-destructive/90 [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
          {{ String(error || 'This QR code options is invalid.') }}
        </p>
      </div>

      <template v-else-if="options.output === 'svg'">
        <QRCodeSVG ref="svgQRCode" :payload="options.payload" :options="svgOptions" />
        <button
          class="btn-primary large min-w-64"
          type="button"
          @click="svgQRCode?.download('qrcodesdk')">
          Download SVG
        </button>
      </template>

      <template v-else-if="options.output === 'image'">
        <QRCodeImage ref="imageQRCode" :payload="options.payload" :options="imageOptions" />
        <button
          class="btn-primary large min-w-64"
          type="button"
          @click="imageQRCode?.download('qrcodesdk')">
          Download PNG
        </button>
      </template>

      <QRCodeCanvas v-else :payload="options.payload" :options="canvasOptions" />
    </div>
  </div>
</template>
