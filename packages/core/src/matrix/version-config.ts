import type {QRCodeErrorCorrectionLevelValue, QRCodeVersion} from '../types';

// Indexed by the internal error-correction value and then QR version (1-40).
// Each character stores its value offset by 40.
// cspell:disable
const ERROR_CORRECTION_CODEWORDS_PER_BLOCK =
  '28B:@8:>>BF>>@@DDBBBBDDDDDDDDDDDDDDDDDDD/27<B:<@F:<@BF>@DFDDDDFFBDFFFFFFFFFFFFFF9D>8>DBB@D@D>@@FDDBDF@FFFFFFFFFFFFFFFFFF5>:B:@:><@DB@<F@DDBFDFFFFDFFFFFFFFFFFFFF';
const ERROR_CORRECTION_BLOCKS =
  ')))**,,,---01122356899:<=?ABDEGIKMNPSUWY)))))****,,,,,..../0011244456789:;;<=>@A))*,,,-.003388:8;=AAAJFHKMPRUX[^adgjnruy))**,,..000248498:=<??ACEJJKNPSUX[]`cfil';
// cspell:enable

export function getErrorCorrectionCodewordsPerBlock(
  version: QRCodeVersion,
  level: QRCodeErrorCorrectionLevelValue,
): number {
  return ERROR_CORRECTION_CODEWORDS_PER_BLOCK.charCodeAt(level * 40 + version - 1) - 40;
}

export function getErrorCorrectionBlockCount(
  version: QRCodeVersion,
  level: QRCodeErrorCorrectionLevelValue,
): number {
  return ERROR_CORRECTION_BLOCKS.charCodeAt(level * 40 + version - 1) - 40;
}

export function getAlignmentPatternPositions(version: QRCodeVersion): number[] {
  const count = getAlignmentPatternCount(version);
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const positions = count ? [4] : [];
  for (let position = version * 4 + 8; positions.length < count; position -= step) {
    positions.splice(1, 0, position);
  }
  return positions;
}

export function getAlignmentPatternCount(version: QRCodeVersion): number {
  return version === 1 ? 0 : Math.floor(version / 7) + 2;
}
