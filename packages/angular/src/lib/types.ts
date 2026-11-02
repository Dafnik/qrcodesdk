/** The download method of the SVG, PNG, WebP, and GIF component instances. */
export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
