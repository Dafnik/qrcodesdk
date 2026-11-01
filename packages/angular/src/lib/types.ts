/** The download method of `QRCodeSVG` and `QRCodeImage` component instances. */
export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
