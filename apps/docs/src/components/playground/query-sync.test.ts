import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
  cliPlaygroundOptions,
  defaultCliOptions,
  resetCliOptions,
  updateCliOptions,
} from './cli-playground.ts';
import {
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  playgroundOpenSections,
  playgroundOptions,
  playgroundView,
  resetQrOptions,
  setPlaygroundSectionOpen,
  updateQrOptions,
} from './playground-options.ts';
import {
  readOpenSectionsFromSearchParams,
  readQrOptionsFromSearchParams,
  readViewFromSearchParams,
  startQrQuerySync,
  writeOpenSectionsToSearchParams,
  writeQrOptionsToSearchParams,
  writeViewToSearchParams,
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
    'https://qrcodesdk.dev/playground/?package=cli&payload=Framework&cli-payload=Terminal&cli-format=svg&open=styling&view=code&other=keep',
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
    assert.deepEqual(playgroundOpenSections.get(), ['styling']);
    assert.equal(playgroundView.get(), 'code');
    setPlaygroundSectionOpen('image', true);
    updateCliOptions({payload: 'Changed', launcher: 'bun'});
    updateQrOptions({moduleSize: 3});
    context.mock.timers.tick(149);
    assert.equal(writes, 0);
    context.mock.timers.tick(1);
    assert.equal(writes, 1);
    assert.equal(url.searchParams.get('cli-payload'), 'Changed');
    assert.equal(url.searchParams.get('cli-launcher'), 'bun');
    assert.equal(url.searchParams.get('module-size'), '3');
    assert.equal(url.searchParams.get('open'), 'image,styling');

    assert.equal(url.searchParams.get('view'), 'code');

    // Resetting values keeps the open sections, the selected view, and their parameters.
    resetQrOptions();
    resetCliOptions();
    context.mock.timers.tick(150);
    assert.equal(writes, 2);
    assert.equal(url.searchParams.get('module-size'), null);
    assert.equal(url.searchParams.get('open'), 'image,styling');
    assert.equal(url.searchParams.get('view'), 'code');
    assert.equal(playgroundView.get(), 'code');
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
    assert.deepEqual(playgroundOpenSections.get(), []);
    assert.equal(playgroundView.get(), 'preview');
    context.mock.timers.tick(150);
    assert.equal(writes, 2);

    // Forward restores the CLI defaults when no CLI parameters are present.
    url = new URL('https://qrcodesdk.dev/playground/?package=cli');
    events.dispatchEvent(new Event('popstate'));
    assert.deepEqual(cliPlaygroundOptions.get(), defaultCliOptions);
    cleanup();
    updateCliOptions({payload: 'After cleanup'});
    context.mock.timers.tick(150);
    assert.equal(writes, 2);
  } finally {
    cleanup?.();
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    playgroundOptions.set({...defaultPlaygroundOptions});
    playgroundOpenSections.set([]);
    playgroundView.set('preview');
    resetCliOptions();
  }
});

describe('playground view query synchronization', () => {
  test('reads the code view and falls back to the preview', () => {
    assert.equal(readViewFromSearchParams(new URLSearchParams('view=code')), 'code');
    assert.equal(readViewFromSearchParams(new URLSearchParams('view=unknown')), 'preview');
    assert.equal(readViewFromSearchParams(new URLSearchParams()), 'preview');
  });

  test('writes the code view and omits the default preview', () => {
    assert.equal(writeViewToSearchParams(new URLSearchParams(), 'code').get('view'), 'code');
    assert.equal(
      writeViewToSearchParams(new URLSearchParams('view=code'), 'preview').has('view'),
      false,
    );
  });
});

describe('playground open sections query synchronization', () => {
  test('reads known sections in display order and ignores unknown names', () => {
    assert.deepEqual(
      readOpenSectionsFromSearchParams(new URLSearchParams('open=accessibility,unknown,image')),
      ['image', 'accessibility'],
    );
    assert.deepEqual(readOpenSectionsFromSearchParams(new URLSearchParams()), []);
  });

  test('writes sections and removes the parameter when all are closed', () => {
    assert.equal(
      writeOpenSectionsToSearchParams(new URLSearchParams(), ['styling', 'accessibility']).get(
        'open',
      ),
      'styling,accessibility',
    );
    assert.equal(
      writeOpenSectionsToSearchParams(new URLSearchParams('open=image'), []).has('open'),
      false,
    );
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

describe('playground styling query synchronization', () => {
  test('round-trips shape names and the single finder color', () => {
    const options = readQrOptionsFromSearchParams(
      new URLSearchParams(
        'modules-shape=diagonal-rounded&finder-ring-shape=extra-rounded&finder-center-shape=circle&finder-color=E11D48',
      ),
    );

    assert.equal(options.moduleShape, 'diagonal-rounded');
    assert.equal(options.finderRingShape, 'extra-rounded');
    assert.equal(options.finderCenterShape, 'circle');
    assert.equal(options.finderColor, '#e11d48');

    const params = writeQrOptionsToSearchParams(
      new URLSearchParams(),
      options,
      defaultPlaygroundOptions,
    );
    assert.equal(params.get('modules-shape'), 'diagonal-rounded');
    assert.equal(params.get('finder-ring-shape'), 'extra-rounded');
    assert.equal(params.get('finder-center-shape'), 'circle');
    assert.equal(params.get('finder-color'), 'e11d48');
  });

  test('round-trips alignment shapes, including an explicit square, and the alignment color', () => {
    const options = readQrOptionsFromSearchParams(
      new URLSearchParams(
        'alignment-ring-shape=square&alignment-center-shape=circle&alignment-color=1D4ED8',
      ),
    );

    assert.equal(options.alignmentRingShape, 'square');
    assert.equal(options.alignmentCenterShape, 'circle');
    assert.equal(options.alignmentColor, '#1d4ed8');
    assert.equal(
      typeof createPlaygroundSVGOptions(options, undefined).style?.alignment,
      'function',
    );

    const params = writeQrOptionsToSearchParams(
      new URLSearchParams(),
      options,
      defaultPlaygroundOptions,
    );
    assert.equal(params.get('alignment-ring-shape'), 'square');
    assert.equal(params.get('alignment-center-shape'), 'circle');
    assert.equal(params.get('alignment-color'), '1d4ed8');

    const defaults = writeQrOptionsToSearchParams(params, defaultPlaygroundOptions, undefined);
    assert.equal(defaults.has('alignment-ring-shape'), false);
    assert.equal(defaults.has('alignment-center-shape'), false);
    assert.equal(defaults.has('alignment-color'), false);
  });

  test('ignores unknown shapes and invalid colors', () => {
    const options = readQrOptionsFromSearchParams(
      new URLSearchParams(
        'modules-shape=star&finder-ring-shape=&finder-color=nope&alignment-ring-shape=star&alignment-color=nope',
      ),
    );

    assert.equal(options.moduleShape, undefined);
    assert.equal(options.finderRingShape, undefined);
    assert.equal(options.finderColor, undefined);
    assert.equal(options.alignmentRingShape, undefined);
    assert.equal(options.alignmentColor, undefined);
  });

  test('ignores parameters of removed options and drops them on write', () => {
    const params = new URLSearchParams(
      'modules-color=ff0000&finder-outer-shape=circle&finder-outer-color=00ff00&finder-center-color=0000ff&other=keep',
    );
    const options = readQrOptionsFromSearchParams(params);

    assert.deepEqual(options, defaultPlaygroundOptions);
    assert.doesNotThrow(() => createPlaygroundSVGOptions(options, undefined));

    writeQrOptionsToSearchParams(params, options, defaultPlaygroundOptions);
    assert.equal(params.toString(), 'other=keep');
  });
});
