import {mount} from 'svelte';

import App from './smoke-consumer.svelte';

const target = document.querySelector<HTMLDivElement>('#app');

if (!target) {
  throw new Error('Expected the Svelte consumer root element');
}

mount(App, {target});
