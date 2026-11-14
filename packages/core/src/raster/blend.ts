import type {RGBAImage} from './types';

export type Color = {red: number; green: number; blue: number; alpha: number};

export function blendPixel(
  image: RGBAImage,
  pixelIndex: number,
  color: Color,
  coverage: number,
): void {
  const index = pixelIndex * 4;
  const sourceAlpha = (color.alpha / 255) * coverage;
  const destinationAlpha = image.data[index + 3]! / 255;
  const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (outputAlpha === 0) {
    image.data.fill(0, index, index + 4);
    return;
  }
  const destinationWeight = destinationAlpha * (1 - sourceAlpha);
  image.data[index] = Math.round(
    (color.red * sourceAlpha + image.data[index]! * destinationWeight) / outputAlpha,
  );
  image.data[index + 1] = Math.round(
    (color.green * sourceAlpha + image.data[index + 1]! * destinationWeight) / outputAlpha,
  );
  image.data[index + 2] = Math.round(
    (color.blue * sourceAlpha + image.data[index + 2]! * destinationWeight) / outputAlpha,
  );
  image.data[index + 3] = Math.round(outputAlpha * 255);
}
