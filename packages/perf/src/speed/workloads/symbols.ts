import {qrcode} from '@qrcodesdk/core/matrix';
import {microQR} from '@qrcodesdk/core/micro';
import {rMQR} from '@qrcodesdk/core/rmqr';

import {type WorkloadGroup, workload} from '../workload.ts';

const micro = microQR();

export const group: WorkloadGroup = {
  id: 'symbols',
  workloads: [
    workload({
      id: 'symbols/qr-v1',
      title: 'Standard QR, version 1 (for comparison)',
      features: ['matrix'],
      run: () => qrcode('12345').matrix(),
    }),
    workload({
      id: 'symbols/micro-m2-numeric',
      title: 'Micro QR M2, numeric',
      features: ['matrix', 'micro'],
      run: () => qrcode('12345').options({symbol: micro}).matrix(),
    }),
    workload({
      id: 'symbols/micro-m4-alphanumeric',
      title: 'Micro QR M4, alphanumeric',
      features: ['matrix', 'micro'],
      run: () => qrcode('QRCODESDK MICRO').options({symbol: micro}).matrix(),
    }),
    workload({
      id: 'symbols/micro-m4-fixed-mask',
      title: 'Micro QR M4, fixed mask',
      features: ['matrix', 'micro'],
      setup: () => microQR({version: 'M4', mask: 0}),
      run: (symbol) => qrcode('QRCODESDK MICRO').options({symbol}).matrix(),
    }),
    workload({
      id: 'symbols/rmqr-auto',
      title: 'rMQR, automatic version',
      features: ['matrix', 'rmqr'],
      setup: () => rMQR(),
      run: (symbol) => qrcode('LOT-2026-0042').options({symbol}).matrix(),
    }),
    workload({
      id: 'symbols/rmqr-r17x139',
      title: 'rMQR R17x139',
      features: ['matrix', 'rmqr'],
      setup: () => rMQR({version: 'R17x139'}),
      run: (symbol) => qrcode('https://qrcodesdk.dev/guides/rmqr-codes').options({symbol}).matrix(),
    }),
  ],
};
