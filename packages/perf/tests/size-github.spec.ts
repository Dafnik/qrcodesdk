import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {afterEach, expect, test, vi} from 'vitest';

import baseline from '../baseline/size.json';
import {
  COMMENT_MARKER,
  commitSizeBaseline,
  prepareSizeComment,
  publishSizeReport,
} from '../src/size/github.ts';

const repository = {owner: 'test', repo: 'test'};
const source = 'a'.repeat(40);
const head = 'b'.repeat(40);
const pull = {
  number: 7,
  state: 'open',
  head: {sha: head, ref: 'feature', repo: {id: 99}},
};
const run = {
  id: 42,
  run_attempt: 1,
  event: 'pull_request',
  head_branch: 'feature',
  head_sha: head,
  head_repository: {id: 99},
  pull_requests: [{number: 7}],
  conclusion: 'success',
  path: '.github/workflows/size.yml@refs/pull/7/merge',
};
const artifact = {id: 5, name: 'size-report', expired: false, size_in_bytes: 100};

function api(overrides: Record<string, unknown> = {}) {
  const responses: Record<string, unknown> = {
    'GET /repos/{owner}/{repo}/commits/main': {sha: source},
    'GET /repos/{owner}/{repo}/contents/{path}': {sha: 'existing-file-sha'},
    'GET /repos/{owner}/{repo}/pulls/{pull_number}': pull,
    'GET /repos/{owner}/{repo}/pulls': [pull],
    'GET /repos/{owner}/{repo}/issues/{issue_number}/comments': [],
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}': {status: 'in_progress'},
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts': {artifacts: [artifact]},
    ...overrides,
  };
  const request = vi.fn(async (route: string, parameters: Record<string, unknown>) => {
    void parameters;
    return {data: responses[route]};
  });
  return {request: request as typeof request & Parameters<typeof prepareSizeComment>[0]['request']};
}

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, {recursive: true})));
});
async function directory() {
  const result = await mkdtemp(path.join(os.tmpdir(), 'size-ci-'));
  directories.push(result);
  return result;
}

async function reports() {
  const root = await directory();
  const baselineFile = path.join(root, 'baseline.json');
  const reportFile = path.join(root, 'report.json');
  await writeFile(baselineFile, JSON.stringify({...baseline, commit: source.slice(0, 12)}));
  await writeFile(reportFile, JSON.stringify({...baseline, commit: head.slice(0, 12)}));
  return {baselineFile, reportFile};
}

test('trusted helpers import directly in Node without a build or third-party imports', () => {
  const module = new URL('../src/size/github.ts', import.meta.url).href;
  expect(
    execFileSync(
      process.execPath,
      ['--input-type=module', '--eval', `await import(${JSON.stringify(module)})`],
      {encoding: 'utf8'},
    ),
  ).toBe('');
});

test('selects only the expected report from the completed PR run', async () => {
  const github = api();
  expect(await prepareSizeComment(github, repository, run, 'completed')).toEqual({
    pr: 7,
    artifact: 5,
  });
  expect(github.request).toHaveBeenCalledWith(
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
    expect.objectContaining({run_id: 42, name: 'size-report'}),
  );
});

test('associates fork runs with empty PR arrays through current API repository, branch and SHA', async () => {
  const github = api({
    'GET /repos/{owner}/{repo}/pulls': [
      pull,
      {...pull, number: 8, head: {...pull.head, repo: {id: 100}}},
    ],
  });
  expect(
    await prepareSizeComment(github, repository, {...run, pull_requests: []}, 'completed'),
  ).toEqual({pr: 7, artifact: 5});
});

test('does not guess when fork run association is ambiguous', async () => {
  const github = api({'GET /repos/{owner}/{repo}/pulls': [pull, {...pull, number: 8}]});
  await expect(
    prepareSizeComment(github, repository, {...run, pull_requests: []}, 'completed'),
  ).rejects.toThrow('unambiguously');
});

test.each([
  {...pull, state: 'closed'},
  {...pull, head: {...pull.head, sha: 'c'.repeat(40)}},
  {...pull, head: {...pull.head, repo: {id: 100}}},
  {...pull, head: {...pull.head, ref: 'other'}},
])('ignores stale, closed or unrelated PRs: %j', async (current) => {
  const github = api({'GET /repos/{owner}/{repo}/pulls/{pull_number}': current});
  expect(await prepareSizeComment(github, repository, run, 'completed')).toBeUndefined();
  expect(github.request.mock.calls.some(([route]) => route.includes('artifacts'))).toBe(false);
});

test.each([
  {...run, event: 'push'},
  {...run, event: 'workflow_dispatch'},
  {...run, conclusion: 'cancelled'},
  {...run, path: '.github/workflows/unrelated.yml'},
])('ignores unrelated and cancelled workflow runs: %j', async (other) => {
  const github = api();
  expect(await prepareSizeComment(github, repository, other, 'completed')).toBeUndefined();
  expect(github.request).not.toHaveBeenCalled();
});

test.each([
  {artifacts: []},
  {artifacts: [{...artifact, expired: true}]},
  {artifacts: [{...artifact, size_in_bytes: 21 * 1024 * 1024}]},
  {artifacts: [{...artifact, name: 'unrelated'}]},
  {artifacts: [artifact, {...artifact, id: 6}]},
])(
  'does not download missing, oversized, expired or ambiguous artifacts: %j',
  async ({artifacts}) => {
    const github = api({'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts': {artifacts}});
    expect(await prepareSizeComment(github, repository, run, 'completed')).toEqual({pr: 7});
  },
);

test('updates only its own bot comment when marking previous results outdated', async () => {
  const github = api({
    'GET /repos/{owner}/{repo}/issues/{issue_number}/comments': [
      {id: 1, body: COMMENT_MARKER, user: {login: 'someone'}},
      {id: 2, body: COMMENT_MARKER, user: {login: 'github-actions[bot]'}},
    ],
  });
  await prepareSizeComment(github, repository, run, 'requested');
  expect(github.request).toHaveBeenCalledWith(
    'PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}',
    expect.objectContaining({comment_id: 2, body: expect.stringContaining('outdated')}),
  );
});

test('delayed requested events do not replace completed results', async () => {
  const github = api({'GET /repos/{owner}/{repo}/actions/runs/{run_id}': {status: 'completed'}});
  await prepareSizeComment(github, repository, run, 'requested');
  expect(github.request.mock.calls.some(([route]) => route.startsWith('POST'))).toBe(false);
});

test('compares against the trusted committed file and includes its source date', async () => {
  const {baselineFile, reportFile} = await reports();
  const after = structuredClone(baseline);
  after.scenarios[0]!.vite.total.gzip += 100_000;
  await writeFile(reportFile, JSON.stringify({...after, baseline: after}));
  const github = api();
  await publishSizeReport(github, repository, run, 7, reportFile, baselineFile);
  expect(github.request).toHaveBeenCalledWith(
    'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
    expect.objectContaining({body: expect.stringContaining('+100,000 B')}),
  );
  const call = github.request.mock.calls.find(([route]) => route.startsWith('POST'))!;
  expect(call[1]['body']).toContain(`Baseline source \`${source.slice(0, 12)}\``);
  expect(call[1]['body']).toContain(baseline.generatedAt);
});

test('reports build or missing baseline failures explicitly', async () => {
  const github = api();
  await publishSizeReport(
    github,
    repository,
    {...run, conclusion: 'failure'},
    7,
    '/missing',
    '/missing',
  );
  expect(github.request).toHaveBeenCalledWith(
    'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
    expect.objectContaining({body: expect.stringContaining('could not complete')}),
  );
});

test('cannot publish a run to a different PR', async () => {
  const github = api();
  await publishSizeReport(github, repository, run, 8, '/missing', '/missing');
  expect(github.request.mock.calls.some(([route]) => route.startsWith('POST'))).toBe(false);
});

test.each(['<!-- size-run:43:1:complete -->', '<!-- size-run:42:2:complete -->'])(
  'old runs and attempts cannot replace newer comments: %s',
  async (stamp) => {
    const github = api({
      'GET /repos/{owner}/{repo}/issues/{issue_number}/comments': [
        {id: 2, body: `${COMMENT_MARKER}\n${stamp}`, user: {login: 'github-actions[bot]'}},
      ],
    });
    await publishSizeReport(github, repository, run, 7, '/missing', '/missing');
    expect(github.request.mock.calls.some(([route]) => route.startsWith('PATCH'))).toBe(false);
  },
);

test('daily writer commits only the fixed baseline path with a file SHA guard', async () => {
  const {baselineFile} = await reports();
  const github = api();
  await commitSizeBaseline(github, repository, baselineFile, source);
  expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/contents/{path}', {
    ...repository,
    path: 'packages/perf/baseline/size.json',
    branch: 'main',
    sha: 'existing-file-sha',
    message: 'chore: update size baseline',
    content: Buffer.from(await readFile(baselineFile, 'utf8')).toString('base64'),
  });
});

test('daily writer refuses a report from another commit or dirty checkout', async () => {
  const {baselineFile} = await reports();
  const github = api();
  await expect(commitSizeBaseline(github, repository, baselineFile, head)).rejects.toThrow(
    'mismatch',
  );
  await writeFile(
    baselineFile,
    JSON.stringify({...baseline, commit: `${source.slice(0, 12)}-dirty`}),
  );
  await expect(commitSizeBaseline(github, repository, baselineFile, source)).rejects.toThrow(
    'mismatch',
  );
  expect(github.request).not.toHaveBeenCalled();
});

test('daily writer refuses to update when main has moved during measurement', async () => {
  const {baselineFile} = await reports();
  const github = api({'GET /repos/{owner}/{repo}/commits/main': {sha: head}});
  await expect(commitSizeBaseline(github, repository, baselineFile, source)).rejects.toThrow(
    'Main changed',
  );
  expect(github.request.mock.calls.some(([route]) => route.startsWith('PUT'))).toBe(false);
});
