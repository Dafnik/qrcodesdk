import {readFile} from 'node:fs/promises';
import {URL, fileURLToPath} from 'node:url';
import {chromium, firefox, webkit} from 'playwright';

const coreSource = await readFile(
  fileURLToPath(new URL('../dist/index.mjs', import.meta.url)),
  'utf8',
);
const assertionSource = await readFile(
  fileURLToPath(new URL('./assert-runtime.mjs', import.meta.url)),
  'utf8',
);

for (const browserType of [chromium, firefox, webkit]) {
  const browser = await browserType.launch({headless: true});

  try {
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.evaluate(
      async ({artifact, assertions}) => {
        const artifactUrl = globalThis.URL.createObjectURL(
          new globalThis.Blob([artifact], {type: 'text/javascript'}),
        );
        const assertionsUrl = globalThis.URL.createObjectURL(
          new globalThis.Blob([assertions], {type: 'text/javascript'}),
        );

        try {
          const [core, runtimeAssertions] = await Promise.all([
            import(artifactUrl),
            import(assertionsUrl),
          ]);
          runtimeAssertions.assertRuntime(core);
        } finally {
          globalThis.URL.revokeObjectURL(artifactUrl);
          globalThis.URL.revokeObjectURL(assertionsUrl);
        }
      },
      {artifact: coreSource, assertions: assertionSource},
    );
  } finally {
    await browser.close();
  }
}
