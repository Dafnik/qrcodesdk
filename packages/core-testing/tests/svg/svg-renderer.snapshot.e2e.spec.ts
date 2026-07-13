import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, test} from 'vitest';

import {QR_CODE_TEST_FIXTURES} from '../../src';
import {renderFixtureSvg} from './svg-fixture';
import {expectSvgToMatchFileSnapshot} from './svg-helpers';

const SNAPSHOT_DIR = fileURLToPath(new URL('../__snapshots__/svg', import.meta.url));

describe('QRCodeSVGRenderer snapshots', () => {
  test.each(QR_CODE_TEST_FIXTURES)('matches %s generated QR SVG snapshot', (fixture) => {
    expectSvgToMatchFileSnapshot(
      renderFixtureSvg(fixture),
      join(SNAPSHOT_DIR, `${fixture.name}.svg`),
    );
  });
});
