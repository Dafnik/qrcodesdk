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

import {QRCodeDownloadImageRenderer} from '@qrcodesdk/browser/image';
import {
  type QRCodeMatrixOptions,
  type QRCodePayload,
  type QRCodeRenderer,
  qrcode,
} from '@qrcodesdk/core';

import {splitOptions} from './split-options';
import {type QRCodeDownloadHandle, withoutManagedContentAttributes} from './types';

/** Creates an image component for one image format, so each format loads only its own encoder. */
export function createQRCodeImageComponent<
  TOptions extends {readonly matrix?: QRCodeMatrixOptions},
>(
  name: string,
  createRenderer: (options?: Omit<TOptions, 'matrix'>) => QRCodeRenderer<HTMLImageElement>,
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: {
      payload: {
        type: [String, Number] as PropType<QRCodePayload>,
        required: true,
      },
      options: Object as PropType<TOptions>,
    },
    setup(props, {attrs, expose}) {
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
              qrcode(props.payload).options(matrixOptions).render(createRenderer(rendererOptions)),
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
          const imageRenderer = createRenderer(rendererOptions);
          qrcode(props.payload)
            .options(matrixOptions)
            .render(QRCodeDownloadImageRenderer({renderer: imageRenderer, filename}));
        },
      };

      expose(handle);

      return () => h('div', {...withoutManagedContentAttributes(attrs), ref: container});
    },
  });
}
