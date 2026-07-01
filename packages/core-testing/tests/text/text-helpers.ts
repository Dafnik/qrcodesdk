import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {expect} from 'vitest';

export function expectTextToMatchFileSnapshot(text: string, snapshotPath: string): void {
  if (process.env.UPDATE_TEXT_SNAPSHOTS === '1') {
    mkdirSync(dirname(snapshotPath), {recursive: true});
    writeFileSync(snapshotPath, text);
  }

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `Text snapshot does not exist: ${snapshotPath}. Run with UPDATE_TEXT_SNAPSHOTS=1 to create it.`,
    );
  }

  expect(text).toBe(readFileSync(snapshotPath, 'utf8'));
}
