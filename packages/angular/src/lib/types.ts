/** The download method of the SVG, PNG, WebP, GIF, and JPEG component instances. */
export type QRCodeDownloadHandle = {
  download(filename?: string): void;
};
