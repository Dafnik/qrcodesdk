import {buildQRCodeMatrix} from './matrix';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeMode,
  QRCodeRenderer,
  QRCodeVersion,
} from './types';

type NoData = {readonly hasData: false; readonly _data: undefined};
type HasData = {readonly hasData: true; readonly _data: string};

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
    private readonly _data: string | number | undefined,
    private readonly config: QRCodeMatrixOptions,
    private readonly currentRenderer?: QRCodeRenderer<unknown>,
  ) {}

  static create(data?: string | number): QRCodeBuilder<NoData, NoRenderer>;
  static create(data: string): QRCodeBuilder<HasData, NoRenderer>;
  static create(data?: string | number) {
    return new QRCodeBuilder(
      data,
      {
        errorCorrectionLevel: 'M',
      },
      undefined,
    );
  }

  data(value: string | number): QRCodeBuilder<HasData, R> {
    return new QRCodeBuilder(value, this.config, this.currentRenderer);
  }

  mode(mode: QRCodeMode): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this.config,
        mode,
      },
      this.currentRenderer,
    );
  }

  errorCorrection(level: QRCodeErrorCorrectionLevel): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this.config,
        errorCorrectionLevel: level,
      },
      this.currentRenderer,
    );
  }

  version(version: QRCodeVersion): QRCodeBuilder<D, R> {
    return new QRCodeBuilder(
      this._data,
      {
        ...this.config,
        version,
      },
      this.currentRenderer,
    );
  }

  renderer<TOutput>(renderer: QRCodeRenderer<TOutput>): QRCodeBuilder<D, HasRenderer<TOutput>> {
    return new QRCodeBuilder(this._data, this.config, renderer);
  }

  matrix(this: QRCodeBuilder<HasData, R>): QRCodeMatrix {
    return buildQRCodeMatrix(this._data, this.config);
  }

  render<TOutput>(this: QRCodeBuilder<HasData, HasRenderer<TOutput>>): TOutput {
    const matrix = buildQRCodeMatrix(this._data, this.config);

    if (!this.currentRenderer) {
      throw new Error('Renderer is missing');
    }

    return this.currentRenderer.render(matrix) as TOutput;
  }
}

export function qrcode(): QRCodeBuilder<NoData, NoRenderer>;
export function qrcode(data: string | number): QRCodeBuilder<HasData, NoRenderer>;
export function qrcode(data?: string | number) {
  return QRCodeBuilder.create(data);
}
