import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, test} from 'vitest';

import {kanji} from '@qrcodesdk/core/kanji';

import {type QRCodeExplainOptions, explainQRCode} from './qrcode-analyzer.ts';
import type {QRCodeEncodingAnalyzer, QRCodeEncodingTrace} from './qrcode-trace-types.ts';
import {
  TRACE_PAGE_SIZE,
  createTraceLoader,
  describeCapacity,
  describeMaskSelection,
  describeModuleProvenance,
  describeVersionSelection,
  formatCodeword,
  resolveTraceState,
  tracePage,
} from './qrcode-trace-view.ts';
import {analyzeQRCodeEncoding} from './qrcode-trace.ts';

function explainAndTrace(options: QRCodeExplainOptions) {
  const explanation = explainQRCode(options);
  return {explanation, trace: analyzeQRCodeEncoding(explanation.matrix, explanation.traceRequest)};
}

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('resolveTraceState', () => {
  const explanation = explainQRCode({payload: 'STATE'});

  test('stays off and runs no analysis while the trace is disabled', () => {
    let calls = 0;
    const analyzer: QRCodeEncodingAnalyzer = (...args) => {
      calls++;
      return analyzeQRCodeEncoding(...args);
    };
    const inputs = {explanation, analyzer, loadError: undefined};
    assert.deepEqual(resolveTraceState({...inputs, enabled: false}), {status: 'off'});
    assert.deepEqual(resolveTraceState({...inputs, enabled: true, explanation: undefined}), {
      status: 'off',
    });
    assert.equal(calls, 0);
  });

  test('reports loading, load failures, and analysis failures', () => {
    assert.deepEqual(
      resolveTraceState({enabled: true, explanation, analyzer: undefined, loadError: undefined}),
      {status: 'loading'},
    );
    assert.deepEqual(
      resolveTraceState({
        enabled: true,
        explanation,
        analyzer: undefined,
        loadError: new Error('network'),
      }),
      {status: 'error', message: 'The encoding trace could not be loaded: network'},
    );
    const failing: QRCodeEncodingAnalyzer = () => {
      throw new Error('Encoding trace: broken');
    };
    assert.deepEqual(
      resolveTraceState({enabled: true, explanation, analyzer: failing, loadError: undefined}),
      {status: 'error', message: 'Encoding trace: broken'},
    );
  });

  test('analyzes the current explanation, so no outdated result is shown', () => {
    const analyzed: string[] = [];
    const analyzer: QRCodeEncodingAnalyzer = (matrix, request) => {
      analyzed.push(request.payload);
      return analyzeQRCodeEncoding(matrix, request);
    };
    const first = resolveTraceState({enabled: true, explanation, analyzer, loadError: undefined});
    const next = explainQRCode({payload: 'NEWER'});
    const second = resolveTraceState({
      enabled: true,
      explanation: next,
      analyzer,
      loadError: undefined,
    });
    assert.deepEqual(analyzed, ['STATE', 'NEWER']);
    assert.equal(first.status === 'ready' && first.trace.segments[0]!.text, 'STATE');
    assert.equal(second.status === 'ready' && second.trace.segments[0]!.text, 'NEWER');
  });
});

describe('createTraceLoader', () => {
  test('imports the trace module once', async () => {
    let imports = 0;
    const load = createTraceLoader(async () => {
      imports++;
      return {analyzeQRCodeEncoding};
    });
    const [first, second] = await Promise.all([load(), load()]);
    assert.equal(await load(), first);
    assert.equal(first, second);
    assert.equal(first.analyzeQRCodeEncoding, analyzeQRCodeEncoding);
    assert.equal(imports, 1);
  });

  test('retries after a failed import', async () => {
    let imports = 0;
    const load = createTraceLoader(async () => {
      imports++;
      if (imports === 1) throw new Error('offline');
      return {analyzeQRCodeEncoding};
    });
    await assert.rejects(load(), /offline/);
    assert.equal((await load()).analyzeQRCodeEncoding, analyzeQRCodeEncoding);
    assert.equal(imports, 2);
  });
});

describe('trace presentation helpers', () => {
  test('pages large placement tables in pages of 64 codewords', () => {
    const {trace} = explainAndTrace({
      payload: 'LARGE',
      version: 40,
      errorCorrectionLevel: 'L',
      mask: 0,
    });
    assert.equal(trace.interleaving.length, 3706);
    const first = tracePage(trace.interleaving, 0);
    assert.equal(first.items.length, TRACE_PAGE_SIZE);
    assert.equal(first.pageCount, 58);
    const last = tracePage(trace.interleaving, 99);
    assert.equal(last.page, 57);
    assert.deepEqual([last.start, last.end, last.items.length], [3648, 3706, 58]);
    assert.equal(tracePage([], 3).pageCount, 1);
    assert.equal(tracePage(trace.interleaving, -1).page, 0);
  });

  test('formats codewords in hexadecimal', () => {
    assert.equal(formatCodeword(0xec), 'EC');
    assert.equal(formatCodeword(0x0a), '0A');
    assert.equal(formatCodeword(0xa0, 4), 'A');
  });

  test('summarizes capacity, version selection, and mask selection', () => {
    const automatic = explainAndTrace({payload: '1'.repeat(35)}).trace;
    assert.equal(describeCapacity(automatic), 'Payload and headers use 131 of 224 data bits.');
    assert.equal(
      describeVersionSelection(automatic),
      'Version 2 was selected automatically: version 1 holds only 128 data bits, but these segments need 131 there.',
    );
    assert.match(describeMaskSelection(automatic), /lowest penalty; ties go to the lower mask/);

    const requested = explainAndTrace({payload: '1', version: 7, mask: 2}).trace;
    assert.equal(
      describeVersionSelection(requested),
      'Version 7 was requested, so it can be larger than these bits need.',
    );
    assert.match(describeMaskSelection(requested), /^Mask 2 was requested/);

    const micro = explainAndTrace({
      payload: '東京タワー',
      micro: true,
      kanji,
      errorCorrectionLevel: 'L',
    });
    assert.equal(
      describeVersionSelection(micro.trace),
      'M3 was selected automatically: M2 does not support kanji mode.',
    );
    assert.match(describeMaskSelection(micro.trace), /highest edge score/);

    const fallback = explainAndTrace({
      payload: 'https://qrcodesdk.dev',
      micro: true,
      microFallback: true,
    }).trace;
    assert.match(describeVersionSelection(fallback), /^No Micro QR code holds these bits/);
  });

  test('describes the codeword and data stream field behind each encoded module', () => {
    const {explanation, trace} = explainAndTrace({
      payload: 'PROVENANCE',
      version: 5,
      errorCorrectionLevel: 'Q',
      mask: 0,
    });
    const module = (codewordIndex: number, codewordBitIndex: number) =>
      explanation.modules.find(
        (candidate) =>
          candidate.codewordIndex === codewordIndex &&
          candidate.codewordBitIndex === codewordBitIndex,
      )!;
    assert.equal(
      describeModuleProvenance(module(0, 0), trace),
      'block 0 data codeword 0 · segment 0 mode indicator',
    );
    assert.equal(
      describeModuleProvenance(module(0, 4), trace),
      'block 0 data codeword 0 · segment 0 character count',
    );
    // Placement position 4 is the second codeword of block 0, which continues the count.
    assert.equal(
      describeModuleProvenance(module(4, 7), trace),
      'block 0 data codeword 1 · segment 0 alphanumeric payload',
    );
    assert.equal(
      describeModuleProvenance(module(62, 0), trace),
      'block 0 error correction codeword 0',
    );
    assert.equal(
      describeModuleProvenance(module(trace.capacity.dataCodewords - 1, 0), trace),
      'block 3 data codeword 15 · pad codeword',
    );

    for (const encoded of explanation.groups.get('encoded')!.modules) {
      assert.ok(describeModuleProvenance(encoded, trace));
    }
    const functional = explanation.modules.find(({role}) => role === 'functional')!;
    assert.equal(describeModuleProvenance(functional, trace), undefined);
  });

  test('describes the padding of Micro QR codes, including the final 4-bit codeword', () => {
    const {explanation, trace} = explainAndTrace({
      payload: '1',
      micro: true,
      microVersion: 'M3',
      errorCorrectionLevel: 'M',
    });
    const regions = new Set(
      explanation.groups
        .get('encoded')!
        .modules.map((module) => describeModuleProvenance(module, trace as QRCodeEncodingTrace)),
    );
    assert.ok(regions.has('block 0 data codeword 0 · segment 0 mode indicator'));
    assert.ok(regions.has('block 0 data codeword 1 · terminator'));
    assert.ok(regions.has('block 0 data codeword 2 · alignment zeros'));
    assert.ok(regions.has('block 0 data codeword 8 · final 4-bit pad codeword'));
    assert.ok(regions.has('block 0 error correction codeword 7'));
  });
});

describe('trace loading boundaries', () => {
  test('the initial explanation code imports trace types only and loads the trace lazily', () => {
    const component = source('../angular/qrcode-explain.ts');
    const view = source('./qrcode-trace-view.ts');
    const analyzer = source('./qrcode-analyzer.ts');
    const staticTraceImport =
      /^import\s[^;]*from '[^']*(?:qrcode-trace|qrcode-explain-trace(?:-chunk)?)\.ts';/m;
    for (const file of [component, view, analyzer]) {
      assert.doesNotMatch(file, staticTraceImport);
    }
    // The analysis and its presentation load together in one chunk.
    assert.match(
      component,
      /type QRCodeTraceChunk = typeof import\('\.\/qrcode-explain-trace-chunk\.ts'\)/,
    );
    assert.match(component, /\(\) => import\('\.\/qrcode-explain-trace-chunk\.ts'\)/);
    assert.match(component, /\*ngComponentOutlet="chunk\.QRCodeExplainTrace/);
    const chunk = source('../angular/qrcode-explain-trace-chunk.ts');
    assert.match(chunk, /export \{analyzeQRCodeEncoding\} from '\.\.\/explain\/qrcode-trace\.ts'/);
    assert.match(chunk, /export \{QRCodeExplainTrace\} from '\.\/qrcode-explain-trace\.ts'/);

    // Neither part needs the Kanji table, which loads only when Kanji mode is on.
    const presentation = source('../angular/qrcode-explain-trace.ts');
    for (const file of [
      component,
      view,
      analyzer,
      chunk,
      presentation,
      source('./qrcode-trace.ts'),
    ]) {
      assert.doesNotMatch(file, /@qrcodesdk\/core\/kanji/);
    }
  });

  test('keeps private core source imports in the adapter', () => {
    const files = [
      './qrcode-analyzer.ts',
      './qrcode-symbol.ts',
      './qrcode-trace.ts',
      './qrcode-trace-view.ts',
      './qrcode-trace-types.ts',
      '../angular/qrcode-explain.ts',
      '../angular/qrcode-explain-trace.ts',
      '../angular/qrcode-explain-trace-chunk.ts',
    ];
    for (const file of files) assert.doesNotMatch(source(file), /packages\/core\/src/);
    const adapter = source('./qrcode-core-source.ts');
    assert.doesNotMatch(adapter, /resolve-matrix-options|matrix\/kanji|kanji\/table|src\/kanji/);
  });

  test('keeps the trace toggle local and the explainer keyboard-accessible', () => {
    const component = source('../angular/qrcode-explain.ts');
    assert.match(component, /readonly traceEnabled = signal\(false\)/);
    assert.match(component, /inputId="qr-encoding-trace"/);
    assert.match(component, /\[attr\.data-trace-open\]/);
    assert.match(component, /\(keydown\)="onSvgKeydown\(\$event\)"/);
    assert.match(component, /tabindex="0"/);
    assert.doesNotMatch(source('../playground/query-sync.ts'), /trace/i);
    assert.match(
      source('../astro/qrcode-explain.astro'),
      /lg:sticky lg:top-20 lg:has-\[\[data-trace-open\]\]:static/,
    );
  });
});
