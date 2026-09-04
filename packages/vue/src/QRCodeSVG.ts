import {type PropType, computed, defineComponent, h} from 'vue';

import {QRCodeDownloadSVGRenderer} from '@qrcodesdk/browser';
import {
  type QRCodeInputData,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  qrcode,
} from '@qrcodesdk/core';

import {splitOptions} from './split-options';
import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';

export type QRCodeSVGProps = QRCodeBaseProps<QRCodeSVGOptions>;

export const QRCodeSVG = defineComponent({
  name: 'QRCodeSVG',
  props: {
    data: {
      type: [String, Number] as PropType<QRCodeInputData>,
      required: true,
    },
    options: Object as PropType<QRCodeSVGOptions>,
  },
  setup(props, {expose}) {
    const resolvedOptions = computed(() => splitOptions(props.options));
    const svgRenderer = computed(() => QRCodeSVGRenderer(resolvedOptions.value[1]));
    const svg = computed(() =>
      qrcode(props.data).config(resolvedOptions.value[0]).render(svgRenderer.value),
    );

    const handle: QRCodeDownloadHandle = {
      download(filename?: string) {
        if (typeof document === 'undefined') return;

        qrcode(props.data)
          .config(resolvedOptions.value[0])
          .render(
            QRCodeDownloadSVGRenderer({
              renderer: svgRenderer.value,
              filename,
            }),
          );
      },
    };

    expose(handle);

    return () => h('div', {innerHTML: svg.value});
  },
});
