import assert from 'node:assert/strict';
import test from 'node:test';

import {getPackageComponentProps, splitInlineCode} from './package-components.mjs';

test('describes the wrapper and download handle of each framework package', () => {
  const props = (packageName) =>
    getPackageComponentProps(packageName)
      .map(({prop, description}) => `${prop} ${description}`)
      .join('\n');

  assert.match(props('@qrcodesdk/react'), /`className`.*wrapper `<div>`/);
  assert.match(props('@qrcodesdk/react'), /`ref`.*`QRCodeCanvas` does not accept a `ref`/);
  assert.match(props('@qrcodesdk/vue'), /Template `ref`/);
  assert.match(props('@qrcodesdk/svelte'), /`bind:this`/);
  assert.match(props('@qrcodesdk/angular'), /no wrapper `<div>`/);
  assert.throws(() => getPackageComponentProps('@qrcodesdk/core'), /No component props/);
});

test('splits text into plain and inline-code parts', () => {
  assert.deepEqual(splitInlineCode('Use `ref` or `bind:this`.'), [
    {code: false, text: 'Use '},
    {code: true, text: 'ref'},
    {code: false, text: ' or '},
    {code: true, text: 'bind:this'},
    {code: false, text: '.'},
  ]);
});
