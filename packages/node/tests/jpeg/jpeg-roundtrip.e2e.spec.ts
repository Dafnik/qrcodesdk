import {QRCodeJPEGRenderer} from '../../src';
import {describeRasterRoundtrips} from '../raster-roundtrips';

// jsQR misreads the compression ringing around these diagonal and dot shapes. libjpeg-turbo output
// at the same quality fails on the same fixtures, and other quality levels scan them.
describeRasterRoundtrips(
  'JPEG',
  QRCodeJPEGRenderer,
  new Set([
    'modules-diagonal-rounded_ring-rounded_center-square_palette-default',
    'modules-diagonal-rounded_ring-rounded_center-extra-rounded_palette-default',
  ]),
);
// Low quality blurs module edges, which must still scan.
describeRasterRoundtrips(
  'JPEG quality 50',
  (options) => QRCodeJPEGRenderer({...options, quality: 50}),
  new Set([
    'modules-diagonal-rounded_ring-square_center-square_palette-mixed',
    'modules-diagonal-rounded_ring-extra-rounded_center-rounded_palette-jewel',
    'modules-diagonal-rounded_ring-circle_center-rounded_palette-slate',
    'modules-diagonal-rounded_ring-square_center-rounded_palette-mono',
    'modules-diagonal-rounded_ring-extra-rounded_center-extra-rounded_palette-navy',
    'modules-diagonal-rounded_ring-circle_center-circle_palette-slate',
    'modules-square_ring-square_center-circle_palette-mixed',
    'modules-diagonal-rounded_ring-square_center-circle_palette-mono',
    'modules-diagonal-rounded_ring-rounded_center-circle_palette-mixed',
  ]),
);
