import {QRCodePNGRenderer} from '../../src';
import {describeRasterRoundtrips} from '../raster-roundtrips';

describeRasterRoundtrips('PNG', QRCodePNGRenderer);
