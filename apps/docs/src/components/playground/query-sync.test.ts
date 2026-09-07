import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {defaultPlaygroundOptions} from './playground-options.ts';
import {readQrOptionsFromSearchParams, writeQrOptionsToSearchParams} from './query-sync.ts';

describe('playground ECI query synchronization', () => {
  test('parses true and false values', () => {
    assert.equal(readQrOptionsFromSearchParams(new URLSearchParams('eci=true')).eci, true);
    assert.equal(readQrOptionsFromSearchParams(new URLSearchParams('eci=false')).eci, false);
  });

  test('falls back to the current default for missing or invalid values', () => {
    const enabledFallback = {...defaultPlaygroundOptions, eci: true};

    assert.equal(readQrOptionsFromSearchParams(new URLSearchParams(), enabledFallback).eci, true);
    assert.equal(
      readQrOptionsFromSearchParams(new URLSearchParams('eci=invalid'), enabledFallback).eci,
      true,
    );
    assert.equal(readQrOptionsFromSearchParams(new URLSearchParams('eci=invalid')).eci, false);
  });

  test('serializes enabled ECI and omits the false default', () => {
    const enabled = writeQrOptionsToSearchParams(
      new URLSearchParams(),
      {...defaultPlaygroundOptions, eci: true},
      defaultPlaygroundOptions,
    );
    const disabled = writeQrOptionsToSearchParams(
      new URLSearchParams('eci=true'),
      defaultPlaygroundOptions,
      defaultPlaygroundOptions,
    );

    assert.equal(enabled.get('eci'), 'true');
    assert.equal(disabled.has('eci'), false);
  });
});

describe('playground package query synchronization', () => {
  test('round-trips Vue and Svelte and rejects unknown packages', () => {
    const vue = readQrOptionsFromSearchParams(new URLSearchParams('package=vue'));
    const svelte = readQrOptionsFromSearchParams(new URLSearchParams('package=svelte'));
    const unknown = readQrOptionsFromSearchParams(new URLSearchParams('package=solid'));

    assert.equal(vue.packageName, 'vue');
    assert.equal(
      writeQrOptionsToSearchParams(new URLSearchParams(), vue, defaultPlaygroundOptions).get(
        'package',
      ),
      'vue',
    );
    assert.equal(svelte.packageName, 'svelte');
    assert.equal(
      writeQrOptionsToSearchParams(new URLSearchParams(), svelte, defaultPlaygroundOptions).get(
        'package',
      ),
      'svelte',
    );
    assert.equal(unknown.packageName, defaultPlaygroundOptions.packageName);
  });
});
