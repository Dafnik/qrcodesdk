import type {PNGImage} from './png-codec';

export type Color = {red: number; green: number; blue: number; alpha: number};

export function blendPixel(
  png: PNGImage,
  pixelIndex: number,
  color: Color,
  coverage: number,
): void {
  const index = pixelIndex * 4;
  const sourceAlpha = (color.alpha / 255) * coverage;
  const destinationAlpha = png.data[index + 3]! / 255;
  const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (outputAlpha === 0) {
    png.data.fill(0, index, index + 4);
    return;
  }
  const destinationWeight = destinationAlpha * (1 - sourceAlpha);
  png.data[index] = Math.round(
    (color.red * sourceAlpha + png.data[index]! * destinationWeight) / outputAlpha,
  );
  png.data[index + 1] = Math.round(
    (color.green * sourceAlpha + png.data[index + 1]! * destinationWeight) / outputAlpha,
  );
  png.data[index + 2] = Math.round(
    (color.blue * sourceAlpha + png.data[index + 2]! * destinationWeight) / outputAlpha,
  );
  png.data[index + 3] = Math.round(outputAlpha * 255);
}
