import assert from 'node:assert/strict';
import {afterEach, describe, test} from 'node:test';

import {cliPlaygroundOptions, defaultCliOptions, resetCliOptions} from './cli-playground.ts';
import {
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  playgroundOpenSections,
  playgroundOptions,
  resetQrOptions,
  updateQrOptions,
} from './playground-options.ts';
import {
  applyCliPreset,
  applyQrPreset,
  cliPlaygroundPresets,
  findCliPreset,
  findQrPreset,
  pickRandomPreset,
  playgroundPresets,
} from './playground-presets.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

afterEach(() => {
  playgroundOpenSections.set([]);
  resetQrOptions();
  resetCliOptions();
});

describe('playground presets', () => {
  test('matches the default options to the classic preset', () => {
    assert.equal(findQrPreset(defaultPlaygroundOptions)?.id, 'classic');
    assert.equal(findCliPreset(defaultCliOptions)?.id, 'classic');
  });

  for (const preset of playgroundPresets) {
    test(`applies and recognizes ${preset.id}`, () => {
      updateQrOptions({payload: 'Keep me', moduleSize: 12});
      applyQrPreset(preset.id);

      const options = playgroundOptions.get();
      assert.equal(options.payload, 'Keep me');
      assert.equal(options.moduleSize, 12);
      assert.equal(findQrPreset(options)?.id, preset.id);
      assert.equal(hasQRCodeError(options), undefined);
    });
  }

  test('opens the advanced styling section and keeps it open on reset', () => {
    playgroundOpenSections.set(['image']);
    applyQrPreset('dots');
    assert.deepEqual(playgroundOpenSections.get(), ['image', 'styling']);

    resetQrOptions();
    assert.deepEqual(playgroundOpenSections.get(), ['image', 'styling']);
  });

  test('replaces shapes from a previous preset', () => {
    applyQrPreset('dots');
    applyQrPreset('classic');

    const options = playgroundOptions.get();
    assert.equal(options.moduleShape, undefined);
    assert.equal(options.finderRingShape, undefined);
    assert.equal(options.finderCenterShape, undefined);
    assert.equal(options.finderColor, undefined);
    assert.equal(options.alignmentRingShape, undefined);
    assert.equal(options.alignmentCenterShape, undefined);
    assert.equal(options.alignmentColor, undefined);
  });

  test('styles alignment patterns through the alignment style part', () => {
    applyQrPreset('dots');
    const {style} = createPlaygroundSVGOptions(playgroundOptions.get(), undefined);

    assert.equal(playgroundOptions.get().alignmentRingShape, 'circle');
    assert.equal(typeof style?.alignment, 'function');
  });

  test('keeps an explicit square alignment shape apart from the module-shaped default', () => {
    applyQrPreset('grape');
    updateQrOptions({alignmentRingShape: 'square'});

    assert.equal(findQrPreset(playgroundOptions.get()), undefined);
  });

  test('treats an explicit square shape like the omitted default', () => {
    applyQrPreset('grape');
    updateQrOptions({finderRingShape: 'square', finderCenterShape: 'square'});

    assert.equal(findQrPreset(playgroundOptions.get())?.id, 'grape');
  });

  test('keeps one finder color and renders it through the finder style part', () => {
    applyQrPreset('sunset');
    const {style} = createPlaygroundSVGOptions(playgroundOptions.get(), undefined);

    assert.equal(playgroundOptions.get().finderColor, '#C2410C');
    assert.equal(typeof style?.modules, 'object');
    assert.equal(typeof style?.finder, 'function');
  });

  test('reports custom styles as no preset', () => {
    applyQrPreset('signal');
    updateQrOptions({foreground: '#123456'});

    assert.equal(findQrPreset(playgroundOptions.get()), undefined);
  });

  test('picks a random preset other than the current one', () => {
    for (const random of [0, 0.5, 0.999]) {
      const preset = pickRandomPreset(playgroundPresets, 'classic', () => random);
      assert.ok(preset);
      assert.notEqual(preset.id, 'classic');
    }
    assert.equal(pickRandomPreset(playgroundPresets, 'classic', () => 0)?.id, 'rounded');
    assert.equal(pickRandomPreset(playgroundPresets, undefined, () => 0)?.id, 'classic');
  });

  test('offers one CLI preset per color pair and applies only colors', () => {
    const ids = cliPlaygroundPresets.map(({id}) => id);
    assert.ok(!ids.includes('rounded'));
    assert.ok(!ids.includes('dots'));

    applyCliPreset('whatsapp');
    const options = cliPlaygroundOptions.get();
    assert.equal(options.foreground, '#075E54');
    assert.equal(options.background, '#FFFFFF');
    assert.equal(options.payload, defaultCliOptions.payload);
    assert.equal(findCliPreset(options)?.id, 'whatsapp');
  });
});
