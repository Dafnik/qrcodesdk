import {QRCodeError} from './error';
import {generateQRCodeMatrix} from './matrix/generate-qrcode-matrix';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeMode,
  QRCodePayload,
  QRCodeRenderer,
  QRCodeVersion,
} from './types';

type NoPayload = {readonly hasPayload: false; readonly _payload: undefined};
type HasPayload = {readonly hasPayload: true; readonly _payload: QRCodePayload};

type BuilderPayload<P> = P extends HasPayload ? QRCodePayload : undefined;
type BuilderRenderer<R> =
  R extends HasRenderer<infer TOutput> ? QRCodeRenderer<TOutput> : undefined;

type NoRenderer = {readonly hasRenderer: false};
type HasRenderer<TOutput> = {
  readonly hasRenderer: true;
  readonly output: TOutput;
};

export class QRCodeBuilder<
  P extends NoPayload | HasPayload,
  R extends NoRenderer | HasRenderer<unknown>,
> {
  private cachedMatrix: QRCodeMatrix | undefined;

  private constructor(
    private readonly _payload: BuilderPayload<P>,
    private readonly _options: QRCodeMatrixOptions,
    private readonly currentRenderer: BuilderRenderer<R>,
  ) {}

  static create(): QRCodeBuilder<NoPayload, NoRenderer>;
  static create(
    payload: QRCodePayload,
    options?: QRCodeMatrixOptions,
  ): QRCodeBuilder<HasPayload, NoRenderer>;
  static create(
    payload?: QRCodePayload,
    options?: QRCodeMatrixOptions,
  ): QRCodeBuilder<NoPayload, NoRenderer> | QRCodeBuilder<HasPayload, NoRenderer> {
    return new QRCodeBuilder(
      payload,
      {
        errorCorrectionLevel: 'M',
        ...options,
      },
      undefined,
    );
  }

  payload(payload: QRCodePayload): QRCodeBuilder<HasPayload, R> {
    return new QRCodeBuilder(payload, this._options, this.currentRenderer);
  }

  mode(mode?: QRCodeMode): QRCodeBuilder<P, R> {
    return this.withOptions({mode});
  }

  options(options?: QRCodeMatrixOptions): QRCodeBuilder<P, R> {
    return this.withOptions(options);
  }

  errorCorrection(level?: QRCodeErrorCorrectionLevel): QRCodeBuilder<P, R> {
    return this.withOptions({errorCorrectionLevel: level});
  }

  version(version?: QRCodeVersion): QRCodeBuilder<P, R> {
    return this.withOptions({version});
  }

  mask(mask?: QRCodeMask): QRCodeBuilder<P, R> {
    return this.withOptions({mask});
  }

  eci(enabled?: boolean): QRCodeBuilder<P, R> {
    return this.withOptions({eci: enabled});
  }

  renderer<TOutput>(renderer: QRCodeRenderer<TOutput>): QRCodeBuilder<P, HasRenderer<TOutput>> {
    return new QRCodeBuilder(this._payload, this._options, renderer);
  }

  matrix(this: QRCodeBuilder<HasPayload, R>): QRCodeMatrix {
    return (this.cachedMatrix ??= generateQRCodeMatrix(this._payload, this._options));
  }

  render<TOutput>(this: QRCodeBuilder<HasPayload, R>, renderer: QRCodeRenderer<TOutput>): TOutput;
  render<TOutput>(this: QRCodeBuilder<HasPayload, HasRenderer<TOutput>>): TOutput;
  render<TOutput>(
    this: QRCodeBuilder<HasPayload, R | HasRenderer<TOutput>>,
    renderer?: QRCodeRenderer<TOutput>,
  ): TOutput {
    const selectedRenderer = renderer ?? this.currentRenderer;

    if (!selectedRenderer) {
      throw new QRCodeError('RENDERER_MISSING', 'QRCode: Renderer missing');
    }

    return selectedRenderer(this.matrix()) as TOutput;
  }

  private withOptions(options: QRCodeMatrixOptions = {}): QRCodeBuilder<P, R> {
    return new QRCodeBuilder(
      this._payload,
      {
        ...this._options,
        ...options,
      },
      this.currentRenderer,
    );
  }
}

export function qrcode(): QRCodeBuilder<NoPayload, NoRenderer>;
export function qrcode(payload: QRCodePayload): QRCodeBuilder<HasPayload, NoRenderer>;
export function qrcode(payload?: QRCodePayload) {
  return payload === undefined ? QRCodeBuilder.create() : QRCodeBuilder.create(payload);
}
