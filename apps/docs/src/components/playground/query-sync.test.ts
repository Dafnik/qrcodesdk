import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {defaultPlaygroundConfig} from './playground-config.ts';
import {readQrConfigFromSearchParams, writeQrConfigToSearchParams} from './query-sync.ts';

describe('playground ECI query synchronization', () => {
  test('parses true and false values', () => {
    assert.equal(readQrConfigFromSearchParams(new URLSearchParams('eci=true')).eci, true);
    assert.equal(readQrConfigFromSearchParams(new URLSearchParams('eci=false')).eci, false);
  });

  test('falls back to the current default for missing or invalid values', () => {
    const enabledFallback = {...defaultPlaygroundConfig, eci: true};

    assert.equal(readQrConfigFromSearchParams(new URLSearchParams(), enabledFallback).eci, true);
    assert.equal(
      readQrConfigFromSearchParams(new URLSearchParams('eci=invalid'), enabledFallback).eci,
      true,
    );
    assert.equal(readQrConfigFromSearchParams(new URLSearchParams('eci=invalid')).eci, false);
  });

  test('serializes enabled ECI and omits the false default', () => {
    const enabled = writeQrConfigToSearchParams(
      new URLSearchParams(),
      {...defaultPlaygroundConfig, eci: true},
      defaultPlaygroundConfig,
    );
    const disabled = writeQrConfigToSearchParams(
      new URLSearchParams('eci=true'),
      defaultPlaygroundConfig,
      defaultPlaygroundConfig,
    );

    assert.equal(enabled.get('eci'), 'true');
    assert.equal(disabled.has('eci'), false);
  });
});
