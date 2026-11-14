import {QRCodeJPEGRenderer} from '../../src';
import {describeRasterRoundtrips} from '../raster-roundtrips';

describeRasterRoundtrips('JPEG', QRCodeJPEGRenderer);
// Low quality blurs module edges, which must still scan.
describeRasterRoundtrips('JPEG quality 50', (options) =>
  QRCodeJPEGRenderer({...options, quality: 50}),
);
