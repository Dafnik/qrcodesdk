import {Component, computed, input} from '@angular/core';

import {
  QRCodeSVG,
  type QRCodeSVGOptions,
  type QRCodeSymbolMatrixOptions,
  circle,
  diagonal,
  finder,
  microQR,
  rMQR,
  rounded,
} from '@qrcodesdk/angular';
import {type QRCodeMatrixOptions, qrcode} from '@qrcodesdk/core';

type SymbolPreview = {
  readonly label: string;
  readonly payload: string;
  readonly matrix: QRCodeMatrixOptions;
  readonly style?: QRCodeSVGOptions['style'];
};

type SymbolPreviewSet = {
  /** `stack` puts wide rMQR codes below each other instead of next to each other. */
  readonly layout: 'row' | 'stack';
  readonly moduleSize: number;
  readonly previews: readonly SymbolPreview[];
};

const micro = (
  version: 'M1' | 'M2' | 'M3' | 'M4',
  errorCorrectionLevel: 'L' | 'M',
): QRCodeSymbolMatrixOptions => ({
  symbol: microQR({version}),
  errorCorrectionLevel,
});

const fallbackMicro = microQR({fallback: true});
const autoRMQR = rMQR();

const SETS = {
  'micro-versions': {
    layout: 'row',
    moduleSize: 6,
    previews: [
      {label: 'M1', payload: '12345', matrix: micro('M1', 'L')},
      {label: 'M2', payload: 'PCB-42', matrix: micro('M2', 'L')},
      {label: 'M3', payload: 'qrcodesdk', matrix: micro('M3', 'L')},
      {label: 'M4', payload: 'qrcodesdk.dev', matrix: micro('M4', 'M')},
    ],
  },
  'micro-fallback': {
    layout: 'row',
    moduleSize: 6,
    previews: [
      {label: 'Micro QR code (M2)', payload: '12345', matrix: {symbol: fallbackMicro}},
      {
        label: 'Standard QR code',
        payload: 'https://qrcodesdk.dev',
        matrix: {symbol: fallbackMicro},
      },
    ],
  },
  'micro-styles': {
    layout: 'row',
    moduleSize: 6,
    previews: [
      {
        label: 'Rounded modules',
        payload: 'qrcodesdk.dev',
        matrix: micro('M4', 'M'),
        style: {
          modules: rounded(),
          finder: finder({center: circle(), color: '#7c3aed'}),
        },
      },
      {
        label: 'Dots',
        payload: 'qrcodesdk.dev',
        matrix: micro('M4', 'M'),
        style: {
          foreground: '#0f766e',
          modules: circle({size: 0.85}),
          finder: finder({center: rounded({radius: 1})}),
        },
      },
      {
        label: 'Leaves',
        payload: 'qrcodesdk.dev',
        matrix: micro('M4', 'M'),
        style: {
          foreground: '#1e3a8a',
          modules: diagonal({radius: 0.6}),
          finder: finder({center: diagonal({radius: 1}), color: '#e11d48'}),
        },
      },
    ],
  },
  'rmqr-intro': {
    layout: 'stack',
    moduleSize: 5,
    previews: [{label: 'rMQR code', payload: 'https://qrcodesdk.dev', matrix: {symbol: autoRMQR}}],
  },
  'rmqr-sizes': {
    layout: 'stack',
    moduleSize: 4,
    previews: [
      {label: 'No version', payload: 'LOT-2026-0042', matrix: {symbol: autoRMQR}},
      {label: 'R7', payload: 'LOT-2026-0042', matrix: {symbol: rMQR({version: 'R7'})}},
      {label: 'R7x139', payload: 'LOT-2026-0042', matrix: {symbol: rMQR({version: 'R7x139'})}},
    ],
  },
  'rmqr-error-correction': {
    layout: 'stack',
    moduleSize: 4,
    previews: [
      {label: 'Level M', payload: 'https://qrcodesdk.dev', matrix: {symbol: autoRMQR}},
      {
        label: 'Level H',
        payload: 'https://qrcodesdk.dev',
        matrix: {symbol: autoRMQR, errorCorrectionLevel: 'H'},
      },
    ],
  },
  'rmqr-styles': {
    layout: 'stack',
    moduleSize: 5,
    previews: [
      {
        label: 'Rounded modules',
        payload: 'https://qrcodesdk.dev',
        matrix: {symbol: autoRMQR},
        style: {
          modules: rounded(),
          finder: finder({center: circle(), color: '#7c3aed'}),
        },
      },
      {
        label: 'Dots',
        payload: 'https://qrcodesdk.dev',
        matrix: {symbol: autoRMQR},
        style: {
          foreground: '#0f766e',
          modules: circle({size: 0.85}),
          finder: finder({center: rounded({radius: 1})}),
        },
      },
    ],
  },
} satisfies Record<string, SymbolPreviewSet>;

export type QRCodeSymbolPreviewSetName = keyof typeof SETS;

/** Renders a set of Micro QR or rMQR codes with captions for the symbol guides. */
@Component({
  selector: 'qrcode-symbol-previews',
  imports: [QRCodeSVG],
  template: `
    <div
      class="flex justify-center gap-x-8 gap-y-6"
      [class.flex-wrap]="previewSet().layout === 'row'"
      [class.items-end]="previewSet().layout === 'row'"
      [class.flex-col]="previewSet().layout === 'stack'"
      [class.items-center]="previewSet().layout === 'stack'">
      @for (preview of previews(); track preview.label) {
        <figure class="m-0 flex max-w-full min-w-0 flex-col items-center gap-2">
          <qrcode-svg
            class="block max-w-full [&>svg]:block [&>svg]:h-auto [&>svg]:max-w-full"
            [options]="preview.options"
            [payload]="preview.payload" />
          <figcaption class="flex flex-col items-center text-center text-sm leading-tight">
            <span class="font-medium">{{ preview.label }}</span>
            <span class="text-(--sl-color-gray-3)">{{ preview.size }} · {{ preview.payload }}</span>
          </figcaption>
        </figure>
      }
    </div>
  `,
})
export class QRCodeSymbolPreviews {
  readonly set = input.required<QRCodeSymbolPreviewSetName>();

  protected readonly previewSet = computed<SymbolPreviewSet>(() => SETS[this.set()]);

  protected readonly previews = computed(() => {
    const {moduleSize, previews} = this.previewSet();

    return previews.map(({label, payload, matrix, style}) => {
      const {width, height} = qrcode(payload).options(matrix).matrix();
      const options: QRCodeSVGOptions = {
        matrix,
        style: {moduleSize, ...style},
        accessibility: {ariaLabel: `${label}: ${width} × ${height} modules encoding ${payload}`},
      };

      return {label, payload, options, size: `${width} × ${height}`};
    });
  });
}
