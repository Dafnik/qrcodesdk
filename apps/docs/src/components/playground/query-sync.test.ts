import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
  cliPlaygroundOptions,
  defaultCliOptions,
  resetCliOptions,
  updateCliOptions,
} from './cli-playground.ts';
import {defaultPlaygroundOptions} from './playground-options.ts';
import {playgroundOptions, updateQrOptions} from './playground-options.ts';
import {
  readQrOptionsFromSearchParams,
  startQrQuerySync,
  writeQrOptionsToSearchParams,
} from './query-sync.ts';

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

test('live query synchronization restores both stores, debounces edits, and handles navigation', (context) => {
  context.mock.timers.enable({apis: ['setTimeout']});
  let url = new URL(
    'https://qrcodesdk.dev/playground/?package=cli&payload=Framework&cli-payload=Terminal&cli-format=svg&other=keep',
  );
  let writes = 0;
  const events = new EventTarget();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const fakeWindow = {
    get location() {
      return {href: url.href, search: url.search};
    },
    history: {
      state: {retained: true},
      replaceState(_state: unknown, _title: string, next: URL) {
        url = new URL(next);
        writes++;
      },
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };
  Object.defineProperty(globalThis, 'window', {value: fakeWindow, configurable: true});
  let cleanup: (() => void) | undefined;
  try {
    cleanup = startQrQuerySync({debounceMs: 150});
    assert.equal(startQrQuerySync(), cleanup);
    assert.equal(playgroundOptions.get().packageName, 'cli');
    assert.equal(playgroundOptions.get().payload, 'Framework');
    assert.equal(cliPlaygroundOptions.get().payload, 'Terminal');
    assert.equal(cliPlaygroundOptions.get().format, 'svg');
    updateCliOptions({payload: 'Changed', launcher: 'bun'});
    updateQrOptions({moduleSize: 3});
    context.mock.timers.tick(149);
    assert.equal(writes, 0);
    context.mock.timers.tick(1);
    assert.equal(writes, 1);
    assert.equal(url.searchParams.get('cli-payload'), 'Changed');
    assert.equal(url.searchParams.get('cli-launcher'), 'bun');
    assert.equal(url.searchParams.get('module-size'), '3');
    assert.equal(url.searchParams.get('other'), 'keep');

    // Simulate Back with an edit still pending. Navigation must cancel that write.
    updateCliOptions({payload: 'Pending'});
    url = new URL(
      'https://qrcodesdk.dev/playground/?package=vue&payload=Previous&cli-payload=Saved&cli-layout=full',
    );
    events.dispatchEvent(new Event('popstate'));
    assert.equal(playgroundOptions.get().packageName, 'vue');
    assert.equal(playgroundOptions.get().payload, 'Previous');
    assert.equal(cliPlaygroundOptions.get().payload, 'Saved');
    assert.equal(cliPlaygroundOptions.get().layout, 'full');
    context.mock.timers.tick(150);
    assert.equal(writes, 1);

    // Forward restores the CLI defaults when no CLI parameters are present.
    url = new URL('https://qrcodesdk.dev/playground/?package=cli');
    events.dispatchEvent(new Event('popstate'));
    assert.deepEqual(cliPlaygroundOptions.get(), defaultCliOptions);
    cleanup();
    updateCliOptions({payload: 'After cleanup'});
    context.mock.timers.tick(150);
    assert.equal(writes, 1);
  } finally {
    cleanup?.();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    playgroundOptions.set({...defaultPlaygroundOptions});
    resetCliOptions();
  }
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
