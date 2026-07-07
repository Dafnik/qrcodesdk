import {assembleQRCodeMatrix} from './matrix/assemble-matrix';
import {createQRCodeCodewords} from './matrix/create-qrcode-codewords';
import {resolveQRCodeMatrixOptions} from './matrix/resolve-matrix-options';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeInputData,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeMode,
  QRCodeRenderer,
  QRCodeVersion,
} from './types';

type NoData = {readonly hasData: false; readonly _data: undefined};
type HasData = {readonly hasData: true; readonly _data: QRCodeInputData};

type BuilderData<D> = D extends HasData ? QRCodeInputData : undefined;
type BuilderRenderer<R> =
  R extends HasRenderer<infer TOutput> ? QRCodeRenderer<TOutput> : undefined;

type NoRenderer = {readonly hasRenderer: false};
type HasRenderer<TOutput> = {
  readonly hasRenderer: true;
  readonly output: TOutput;
};

export class QRCodeBuilder<
  D extends NoData | HasData,
  R extends NoRenderer | HasRenderer<unknown>,
> {
  private constructor(
    private readonly _data: BuilderData<D>,
    private readonly _config: QRCodeMatrixOptions,
    private readonly currentRenderer: BuilderRenderer<R>,
  ) {}

  static create(): QRCodeBuilder<NoData, NoRenderer>;
  static create(
    data: QRCodeInputData,
    config?: QRCodeMatrixOptions,
  ): QRCodeBuilder<HasData, NoRenderer>;
  static create(
    data?: QRCodeInputData,
    config?: QRCodeMatrixOptions,
  ): QRCodeBuilder<NoData, NoRenderer> | QRCodeBuilder<HasData, NoRenderer> {
    return new QRCodeBuilder(
      data,
      {
        errorCorrectionLevel: 'M',
        ...config,
      },
      undefined,
    );
  }

  data(value: QRCodeInputData): QRCodeBuilder<HasData, R> {
    return new QRCodeBuilder(value, this._config, this.currentRenderer);
  }

  mode(mode?: QRCodeMode): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this._config,
        mode,
      },
      this.currentRenderer,
    );
  }

  config(config?: QRCodeMatrixOptions): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this._config,
        ...config,
      },
      this.currentRenderer,
    );
  }

  errorCorrection(level?: QRCodeErrorCorrectionLevel): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this._config,
        errorCorrectionLevel: level,
      },
      this.currentRenderer,
    );
  }

  version(version?: QRCodeVersion): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this._config,
        version,
      },
      this.currentRenderer,
    );
  }

  mask(mask?: QRCodeMask): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this._config,
        mask,
      },
      this.currentRenderer,
    );
  }

  renderer<TOutput>(renderer: QRCodeRenderer<TOutput>): QRCodeBuilder<D, HasRenderer<TOutput>> {
    return new QRCodeBuilder(this._data, this._config, renderer);
  }

  matrix(this: QRCodeBuilder<HasData, R>): QRCodeMatrix {
    const resolved = resolveQRCodeMatrixOptions(this._data, this._config);
    const codewords = createQRCodeCodewords(resolved);

    return assembleQRCodeMatrix(
      resolved.version,
      resolved.errorCorrectionLevel,
      codewords,
      resolved.mask,
    );
  }

  render<TOutput>(this: QRCodeBuilder<HasData, R>, renderer: QRCodeRenderer<TOutput>): TOutput;
  render<TOutput>(this: QRCodeBuilder<HasData, HasRenderer<TOutput>>): TOutput;
  render<TOutput>(
    this: QRCodeBuilder<HasData, R | HasRenderer<TOutput>>,
    renderer?: QRCodeRenderer<TOutput>,
  ): TOutput {
    const selectedRenderer = renderer ?? this.currentRenderer;

    if (!selectedRenderer) {
      throw new Error('QRCode: Renderer missing');
    }

    return selectedRenderer(this.matrix()) as TOutput;
  }
}

export function qrcode(): QRCodeBuilder<NoData, NoRenderer>;
export function qrcode(data: QRCodeInputData): QRCodeBuilder<HasData, NoRenderer>;
export function qrcode(data?: QRCodeInputData) {
  return data === undefined ? QRCodeBuilder.create() : QRCodeBuilder.create(data);
}
