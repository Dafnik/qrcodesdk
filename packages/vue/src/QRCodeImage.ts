import {
  type PropType,
  type WatchStopHandle,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';

import {
  QRCodeDownloadImageRenderer,
  type QRCodeImageOptions,
  QRCodeImageRenderer,
} from '@qrcodesdk/browser';
import {type QRCodePayload, qrcode} from '@qrcodesdk/core';

import {splitOptions} from './split-options';
import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';

export type QRCodeImageProps = QRCodeBaseProps<QRCodeImageOptions>;

export const QRCodeImage = defineComponent({
  name: 'QRCodeImage',
  props: {
    payload: {
      type: [String, Number] as PropType<QRCodePayload>,
      required: true,
    },
    options: Object as PropType<QRCodeImageOptions>,
  },
  setup(props, {expose}) {
    const container = ref<HTMLDivElement>();
    let stopRendering: WatchStopHandle | undefined;

    onMounted(() => {
      stopRendering = watch(
        [() => props.payload, () => props.options],
        () => {
          const host = container.value;
          if (!host) return;

          const [matrixOptions, rendererOptions] = splitOptions(props.options);
          host.replaceChildren(
            qrcode(props.payload)
              .options(matrixOptions)
              .render(QRCodeImageRenderer(rendererOptions)),
          );
        },
        {deep: true, immediate: true},
      );
    });

    onUnmounted(() => stopRendering?.());

    const handle: QRCodeDownloadHandle = {
      download(filename?: string) {
        if (typeof document === 'undefined') return;

        const [matrixOptions, rendererOptions] = splitOptions(props.options);
        const imageRenderer = QRCodeImageRenderer(rendererOptions);
        qrcode(props.payload)
          .options(matrixOptions)
          .render(QRCodeDownloadImageRenderer({renderer: imageRenderer, filename}));
      },
    };

    expose(handle);

    return () => h('div', {ref: container});
  },
});
