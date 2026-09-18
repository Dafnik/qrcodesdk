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
import {type QRCodePayload, qrcode} from '@qrcodesdk/core';

import {splitOptions} from './split-options';
import {type QRCodeBaseProps, withoutManagedContentAttributes} from './types';

export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export const QRCodeCanvas = defineComponent({
  name: 'QRCodeCanvas',
  inheritAttrs: false,
  props: {
    payload: {
      type: [String, Number] as PropType<QRCodePayload>,
      required: true,
    },
    options: Object as PropType<QRCodeCanvasOptions>,
  },
  setup(props, {attrs}) {
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
              .render(QRCodeCanvasRenderer(rendererOptions)),
          );
        },
        {deep: true, immediate: true},
      );
    });

    onUnmounted(() => stopRendering?.());

    return () => h('div', {...withoutManagedContentAttributes(attrs), ref: container});
  },
});
