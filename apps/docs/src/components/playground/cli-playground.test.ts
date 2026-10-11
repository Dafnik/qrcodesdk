import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, test} from 'node:test';
import {fileURLToPath} from 'node:url';

import {QRCodeSVGRenderer, QRCodeTextRenderer, qrcode} from '@qrcodesdk/core';

import {
  type CliPlaygroundOptions,
  cliPlaygroundOptions,
  cliPreview,
  createCliPreview,
  createCliSVGOptions,
  createCliTextOptions,
  createTerminalRows,
  defaultCliOptions,
  generateCliCommand,
  parseTerminalRuns,
  quoteShellArgument,
  resetCliOptions,
  updateCliOptions,
} from './cli-playground.ts';
import {readCliOptionsFromSearchParams, writeCliOptionsToSearchParams} from './cli-query.ts';
import {
  defaultPlaygroundOptions,
  playgroundOptions,
  updateQrOptions,
} from './playground-options.ts';
import {readQrOptionsFromSearchParams} from './query-sync.ts';

const cliBinary = fileURLToPath(
  new URL('../../../../../packages/cli/dist/bin.mjs', import.meta.url),
);
function runCommand(options: CliPlaygroundOptions, {tty = true, noColor = false} = {}): string {
  return execFileSync(
    '/bin/sh',
    [
      '-c',
      'qrc() { "$CLI_NODE" --import "$CLI_SETUP" "$CLI_BIN" "$@"; }\n' +
        generateCliCommand({...options, launcher: 'installed'}),
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        CLI_NODE: process.execPath,
        CLI_BIN: cliBinary,
        NO_COLOR: '1',
        // Model a color-enabled terminal while capturing its output for assertions.
        CLI_SETUP:
          'data:text/javascript,' +
          encodeURIComponent(
            `process.stdout.isTTY = ${tty}; ${noColor ? '' : 'delete process.env.NO_COLOR;'}`,
          ),
      },
    },
  );
}

afterEach(() => {
  resetCliOptions();
  playgroundOptions.set({...defaultPlaygroundOptions});
});

describe('CLI commands and real CLI output', () => {
  test('omits flags for default text settings from both displayed commands', () => {
    const command = "npx @qrcodesdk/cli --payload 'https://qrcodesdk.dev'";
    assert.equal(generateCliCommand(defaultCliOptions), command);
    const preview = createCliPreview(defaultCliOptions);
    assert.equal(preview.state, 'ready');
    if (preview.state === 'ready') assert.equal(preview.command, command);
  });

  test('omits explicitly selected default matrix and opaque color values', () => {
    assert.equal(
      generateCliCommand({
        ...defaultCliOptions,
        errorCorrectionLevel: 'M',
        foreground: '#000000FF',
        background: '#FFFFFFFF',
        eci: false,
      }),
      generateCliCommand(defaultCliOptions),
    );
  });

  test('keeps non-default flags and required SVG output paths', () => {
    assert.equal(
      generateCliCommand({...defaultCliOptions, format: 'svg'}),
      "npx @qrcodesdk/cli --payload 'https://qrcodesdk.dev' --format svg --output 'qrcode.svg'",
    );
    assert.equal(
      generateCliCommand({
        ...defaultCliOptions,
        errorCorrectionLevel: 'H',
        version: 2,
        mask: 0,
        eci: true,
        moduleSize: 3,
        quietZone: 0,
        layout: 'full',
        ansi: 'off',
      }),
      "npx @qrcodesdk/cli --payload 'https://qrcodesdk.dev' --error-correction H --version 2 --mask 0 --eci --module-size 3 --quiet-zone 0 --layout full --ansi off",
    );
  });

  test('the minimal default command matches a color-enabled terminal', () => {
    const preview = createCliPreview(defaultCliOptions);
    assert.equal(preview.state, 'ready');
    if (preview.state === 'ready') assert.equal(runCommand(defaultCliOptions), preview.text);
  });

  for (const environment of [{tty: false}, {noColor: true}]) {
    test(`omitted ANSI defaults honor runtime ${JSON.stringify(environment)}`, () => {
      assert.equal(
        runCommand(defaultCliOptions, environment),
        qrcode(defaultCliOptions.payload).render(
          QRCodeTextRenderer(createCliTextOptions({...defaultCliOptions, ansi: 'off'})),
        ) + '\n',
      );
    });
  }

  for (const [launcher, prefix] of Object.entries({
    npm: 'npx @qrcodesdk/cli',
    installed: 'qrc',
    pnpm: 'pnpm dlx @qrcodesdk/cli',
    viteplus: 'vp dlx @qrcodesdk/cli',
    bun: 'bunx @qrcodesdk/cli',
    yarn: 'yarn dlx @qrcodesdk/cli',
  })) {
    test(`generates the ${launcher} launcher`, () => {
      assert.ok(
        generateCliCommand({
          ...defaultCliOptions,
          launcher: launcher as CliPlaygroundOptions['launcher'],
        }).startsWith(prefix + ' '),
      );
    });
  }

  for (const ansi of ['off', 'blocks', 'background'] as const) {
    for (const layout of ['compact', 'full'] as const) {
      test(`${ansi} / ${layout} matches real CLI terminal output`, () => {
        const options = {
          ...defaultCliOptions,
          ansi,
          layout,
          payload: "-hello 'Grüße'\n$HOME `pwd` ; $(echo unsafe)",
          foreground: '#12345680' as const,
          background: '#abcdef80' as const,
        };
        const preview = createCliPreview(options);
        assert.equal(preview.state, 'ready');
        if (preview.state !== 'ready') return;
        assert.equal(runCommand(options, {noColor: ansi !== 'blocks'}), preview.text);
        assert.ok(preview.runs.every((run) => !run.text.includes('\u001b')));
        const rows = createTerminalRows(preview.runs);
        assert.equal(
          rows.map((row) => row.map((cell) => cell.text).join('')).join('\n') + '\n',
          // eslint-disable-next-line no-control-regex -- Rows must retain the CLI text after ANSI decoding.
          preview.text!.replace(/\u001b\[[\d;]+m/g, ''),
        );
        assert.ok(
          rows.every(
            (row) =>
              row.reduce((length, cell) => length + cell.text.length, 0) ===
              rows[0]!.reduce((length, cell) => length + cell.text.length, 0),
          ),
        );
        assert.equal(
          preview.runs.map((run) => run.text).join(''),
          // eslint-disable-next-line no-control-regex -- Compare rendered text without actual ANSI sequences.
          preview.text!.replace(/\u001b\[[\d;]+m/g, ''),
        );
        assert.equal(
          preview.text,
          qrcode(options.payload).render(QRCodeTextRenderer(createCliTextOptions(options))) + '\n',
        );
        if (ansi === 'background') assert.doesNotMatch(preview.command, /--layout/);
        if (ansi === 'off') assert.doesNotMatch(preview.command, /--foreground|--background/);
        assert.doesNotMatch(preview.command, /--output|--title|--aria-label/);
      });
    }
  }

  test('SVG command writes the same SVG as the preview options', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qrcodesdk-cli-'));
    try {
      const options: CliPlaygroundOptions = {
        ...defaultCliOptions,
        format: 'svg',
        outputPath: join(directory, "QR code's.svg"),
        payload: 'HELLO WORLD',
        mode: 'alphanumeric',
        errorCorrectionLevel: 'H',
        version: 2,
        mask: 0,
        eci: true,
        moduleSize: 3,
        quietZone: 0,
        title: "A QR 'title'",
        ariaLabel: 'Scan <this>',
        foreground: '#112233',
        background: '#ffeecc80',
      };
      const preview = createCliPreview(options);
      assert.equal(preview.state, 'ready');
      assert.equal(runCommand(options), '');
      const {matrix, ...rendererOptions} = createCliSVGOptions(options);
      assert.equal(
        readFileSync(options.outputPath, 'utf8'),
        qrcode(options.payload).options(matrix).render(QRCodeSVGRenderer(rendererOptions)),
      );
      assert.doesNotMatch(generateCliCommand(options), /--ansi|--layout|png/);
      assert.match(generateCliCommand(options), /--eci/);
    } finally {
      rmSync(directory, {recursive: true, force: true});
    }
  });

  test('shell quoting keeps every special character literal', () => {
    const value = "-x ' quoted\nGrüße $HOME `pwd` $(echo x); & | < > \\";
    const output = execFileSync('/bin/sh', ['-c', `printf '%s' ${quoteShellArgument(value)}`], {
      encoding: 'utf8',
    });
    assert.equal(output, value);
    assert.throws(() => quoteShellArgument('a\0b'), /NUL/);
  });

  for (const patch of [
    {moduleSize: 0},
    {moduleSize: 1.5},
    {quietZone: -1},
    {quietZone: Number.MAX_SAFE_INTEGER + 1},
    {version: 41},
    {mask: 8},
    {foreground: '#abc'},
    {background: '#gggggg'},
    {format: 'svg', outputPath: ' '},
    {payload: 'x\0y'},
    {payload: 'HELLO', mode: 'numeric'},
    {moduleSize: 1000},
    {format: 'png'},
  ]) {
    test(`rejects invalid configuration ${JSON.stringify(patch)}`, () => {
      assert.equal(
        createCliPreview({...defaultCliOptions, ...patch} as CliPlaygroundOptions).state,
        'error',
      );
    });
  }
});

describe('terminal text runs', () => {
  test('terminal rows preserve half blocks, blank rows, color boundaries, and trailing spaces', () => {
    assert.deepEqual(
      createTerminalRows([
        {text: '██▀▀', foreground: 'black', background: 'white'},
        {text: '▀▄  \n\n', foreground: 'red', background: 'white'},
        {text: '    \n', background: 'blue'},
      ]),
      [
        [
          {text: '██', foreground: 'black', background: 'white'},
          {text: '▀▀', foreground: 'black', background: 'white'},
          {text: '▀', foreground: 'red', background: 'white'},
          {text: '▄', foreground: 'red', background: 'white'},
          {text: '  ', foreground: 'red', background: 'white'},
        ],
        [],
        [{text: '    ', background: 'blue'}],
      ],
    );
  });
  test('preserves spaces, glyphs, newlines and reset colors', () => {
    assert.deepEqual(parseTerminalRuns('\u001b[38;2;1;2;3m\u001b[48;2;4;5;6m▀  █\u001b[0m\n  '), [
      {text: '▀  █', foreground: 'rgb(1, 2, 3)', background: 'rgb(4, 5, 6)'},
      {text: '\n  ', foreground: undefined, background: undefined},
    ]);
  });
  test('ANSI background produces colored whitespace with core-resolved alpha', () => {
    const result = createCliPreview({
      ...defaultCliOptions,
      ansi: 'background',
      foreground: '#00000080',
      background: '#ffffff80',
    });
    assert.equal(result.state, 'ready');
    if (result.state !== 'ready') return;
    assert.ok(result.runs.some((run) => run.background === 'rgb(127, 127, 127)'));
    assert.ok(result.runs.every((run) => !run.text.includes('\u001b')));
    assert.ok(result.runs.every((run) => /^[ \n]*$/.test(run.text)));
    assert.equal(
      result.runs.map((run) => run.text).join(''),
      // eslint-disable-next-line no-control-regex -- Strip actual ANSI ESC sequences from CLI output.
      result.text!.replace(/\u001b\[[\d;]+m/g, ''),
    );
  });
});

describe('CLI state and query parameters', () => {
  test('retains the VitePlus launcher selected in the controls when restoring a URL', () => {
    const params = new URLSearchParams();
    writeCliOptionsToSearchParams(params, {...defaultCliOptions, launcher: 'viteplus'});
    assert.equal(readCliOptionsFromSearchParams(params).launcher, 'viteplus');
  });
  test('package switching preserves both stores and only CLI reset changes CLI settings', () => {
    updateQrOptions({payload: 'Framework', moduleSize: 9, packageName: 'cli'});
    updateCliOptions({payload: 'Terminal', moduleSize: 2});
    assert.equal(cliPreview.get()?.state, 'ready');
    updateQrOptions({packageName: 'react'});
    assert.equal(cliPreview.get(), undefined);
    assert.equal(cliPlaygroundOptions.get().payload, 'Terminal');
    assert.equal(playgroundOptions.get().payload, 'Framework');
    resetCliOptions();
    assert.deepEqual(cliPlaygroundOptions.get(), defaultCliOptions);
    assert.equal(playgroundOptions.get().moduleSize, 9);
  });
  test('round-trips all settings and preserves unrelated parameters', () => {
    const options: CliPlaygroundOptions = {
      ...defaultCliOptions,
      payload: 'Grüße\ntext',
      launcher: 'installed',
      format: 'svg',
      outputPath: 'QR file.svg',
      mode: 'octet',
      errorCorrectionLevel: 'Q',
      version: 5,
      mask: 0,
      eci: true,
      moduleSize: 2,
      quietZone: 0,
      layout: 'full',
      ansi: 'background',
      foreground: '#00112280',
      background: '#ffffff',
      title: 'Title',
      ariaLabel: 'Scan',
    };
    const params = new URLSearchParams('other=preserved&package=cli');
    writeCliOptionsToSearchParams(params, options);
    assert.deepEqual(readCliOptionsFromSearchParams(params), options);
    assert.equal(params.get('other'), 'preserved');
    assert.equal(readQrOptionsFromSearchParams(params).packageName, 'cli');
    writeCliOptionsToSearchParams(params, defaultCliOptions);
    assert.equal([...params.keys()].filter((key) => key.startsWith('cli-')).length, 0);
  });
  test('malformed settings fall back to defaults and framework URLs still work', () => {
    const params = new URLSearchParams(
      'cli-format=png&cli-launcher=unknown&cli-version=41&cli-mask=-1&cli-module-size=0&cli-quiet-zone=2.5&cli-ansi=x&cli-foreground=red&cli-eci=yes',
    );
    assert.deepEqual(readCliOptionsFromSearchParams(params), defaultCliOptions);
    assert.equal(
      readQrOptionsFromSearchParams(new URLSearchParams('package=vue&module-size=8')).packageName,
      'vue',
    );
  });
});
