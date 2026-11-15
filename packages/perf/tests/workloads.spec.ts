import {expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core/matrix';

import {ALPHANUMERIC_PAYLOADS, QR_VERSIONS} from '../src/speed/workload.ts';
import {group as stages} from '../src/speed/workloads/matrix-stages.ts';
import {group as raster} from '../src/speed/workloads/raster-node.ts';

test.each(QR_VERSIONS)(
  'mask scoring uses a filled and masked version %i symbol',
  async (version) => {
    const workload = stages.workloads.find(
      (item) => item.id === `stages/evaluate-mask-v${version}`,
    )!;
    const state = (await workload.setup!()) as {modules: Uint8Array};
    const expected = qrcode(ALPHANUMERIC_PAYLOADS[version])
      .options({mode: 'alphanumeric', version, mask: 0})
      .matrix();
    expect([...state.modules]).toEqual([...expected.modules]);
  },
);

test.each(['gray', 'color'])(
  'JPEG %s workload selects the intended channel count',
  async (color) => {
    const workload = raster.workloads.find((item) => item.id === `encoder/jpeg-${color}-v1`)!;
    const bytes = workload.run(await workload.setup!()) as Uint8Array;
    // SOF0 contains the component count after precision, height, and width.
    let offset = 2;
    while (offset < bytes.length && bytes[offset + 1] !== 0xc0) {
      offset += 2 + (bytes[offset + 2]! << 8) + bytes[offset + 3]!;
    }
    expect(offset).toBeLessThan(bytes.length);
    expect(bytes[offset + 9]).toBe(color === 'gray' ? 1 : 3);
  },
);
