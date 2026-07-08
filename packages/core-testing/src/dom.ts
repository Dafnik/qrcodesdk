export type CapturedDownload = {
  href: string;
  filename: string;
};

type SpyHandle<TValue> = TValue extends (...args: infer TArgs) => infer TReturn
  ? {
      mockImplementation(implementation: (...args: TArgs) => TReturn): void;
      mockReturnValue(value: TReturn): void;
    }
  : never;

type MockApi = {
  fn(): () => void;
  spyOn<TObject, TKey extends keyof TObject>(
    object: TObject,
    methodName: TKey,
  ): SpyHandle<TObject[TKey]>;
};

export function captureDownloads(mockApi: Pick<MockApi, 'spyOn'>): CapturedDownload[] {
  const createElement = document.createElement.bind(document);
  const downloads: CapturedDownload[] = [];

  mockApi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
    const element = createElement(tagName, options);

    if (tagName.toLowerCase() === 'a') {
      mockApi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(function click(
        this: HTMLAnchorElement,
      ) {
        downloads.push({
          href: this.href,
          filename: this.download,
        });
      });
    }

    return element;
  });

  return downloads;
}

export function mockCanvasRendering(mockApi: MockApi): void {
  mockApi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((
    contextId: string,
  ) => {
    if (contextId !== '2d') return null;

    return {
      fillStyle: '#000000',
      fillRect: mockApi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }) as HTMLCanvasElement['getContext']);
  mockApi
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockReturnValue('data:image/png;base64,qrcode');
}
