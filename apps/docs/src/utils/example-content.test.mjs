import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {createExampleContent} from './example-content.mjs';

describe('example content', () => {
  test('preserves Vue single-file components', () => {
    const source = `<script setup lang="ts">
const message = 'Vue example';
</script>

<template><p>{{ message }}</p></template>
`;

    assert.equal(createExampleContent('/repo/src/components/vue/example.vue', source), source);
  });

  test('preserves Svelte components', () => {
    const source = `<script lang="ts">
const message = 'Svelte example';
</script>

<p>{message}</p>
`;

    assert.equal(
      createExampleContent('/repo/src/components/svelte/example.svelte', source),
      source,
    );
  });

  test('removes Astro-only Angular providers', () => {
    const source = `export class Example {
  static clientProviders = [provideClientHydration()];
}`;
    const content = createExampleContent('/repo/src/components/angular/example.ts', source);

    assert.doesNotMatch(content, /static clientProviders/);
    assert.match(content, /bootstrapApplication\(Example/);
  });
});
