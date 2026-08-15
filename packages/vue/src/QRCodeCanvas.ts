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

import {type QRCodeCanvasOptions, QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {type QRCodeInputData, qrcode} from '@qrcodesdk/core';

import type {QRCodeBaseProps} from './types';

export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export const QRCodeCanvas = defineComponent({
  name: 'QRCodeCanvas',
  props: {
    data: {
      type: [String, Number] as PropType<QRCodeInputData>,
      required: true,
    },
    options: Object as PropType<QRCodeCanvasOptions>,
  },
  setup(props) {
    const container = ref<HTMLDivElement>();
    let stopRendering: WatchStopHandle | undefined;

    onMounted(() => {
      stopRendering = watch(
        [() => props.data, () => props.options],
        () => {
          const host = container.value;
          if (!host) return;

          host.replaceChildren(
            qrcode(props.data).config(props.options).render(QRCodeCanvasRenderer(props.options)),
          );
        },
        {deep: true, immediate: true},
      );
    });

    onUnmounted(() => stopRendering?.());

    return () => h('div', {ref: container});
  },
});
