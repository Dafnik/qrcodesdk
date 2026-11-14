import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

import {QR_CODE_RENDER_FIXTURES, QR_CODE_RENDER_FIXTURE_GROUPS} from '../src';

const SVG_SNAPSHOT_DIR = fileURLToPath(new URL('__snapshots__/svg', import.meta.url));

describe('render fixtures', () => {
  test('have unique ids and snapshot paths', () => {
    expect(new Set(QR_CODE_RENDER_FIXTURES.map(({id}) => id)).size).toBe(
      QR_CODE_RENDER_FIXTURES.length,
    );
    expect(new Set(QR_CODE_RENDER_FIXTURES.map(({snapshotPath}) => snapshotPath)).size).toBe(
      QR_CODE_RENDER_FIXTURES.length,
    );
    for (const {id, fixtures} of QR_CODE_RENDER_FIXTURE_GROUPS) {
      expect(fixtures.length).toBeGreaterThan(0);
      for (const fixture of fixtures) expect(fixture.id).toBe(`${id}/${fixture.name}`);
    }
  });

  // The docs dev tools show these fixtures, so every SVG snapshot file must belong to one.
  test('match the SVG snapshot files one to one', () => {
    const files = readdirSync(SVG_SNAPSHOT_DIR, {recursive: true, encoding: 'utf8'})
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.slice(0, -'.svg'.length).replaceAll('\\', '/'));
    expect(new Set(files)).toEqual(new Set(QR_CODE_RENDER_FIXTURES.map((f) => f.snapshotPath)));
  });
});
