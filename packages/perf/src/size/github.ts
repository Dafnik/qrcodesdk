/** Trusted workflow helpers. These run without package installation or PR code. */
import {Buffer} from 'node:buffer';
import {readFile, stat} from 'node:fs/promises';

import {formatSizeComparison, parseSizeSummary} from './comparison.ts';

type Github = {
  request<T>(route: string, parameters: Record<string, unknown>): Promise<{data: T}>;
};
type Repository = {owner: string; repo: string};
type Pull = {
  number: number;
  state: string;
  head: {sha: string; ref: string; repo: {id: number} | null};
};
type Comment = {id: number; body: string; user: {login: string}};
type Run = {
  id: number;
  run_attempt: number;
  event: string;
  head_branch: string;
  head_sha: string;
  head_repository: {id: number};
  pull_requests: {number: number}[];
  conclusion: string | null;
  path: string;
};
type Artifact = {id: number; name: string; expired: boolean; size_in_bytes: number};

export const COMMENT_MARKER = '<!-- qrcodesdk-size-report -->';
const BASELINE_PATH = 'packages/perf/baseline/size.json';
const MAX_REPORT_BYTES = 20 * 1024 * 1024;
const SHA = /^[a-f0-9]{40}$/;

async function list<T>(
  github: Github,
  route: string,
  parameters: Record<string, unknown>,
): Promise<T[]> {
  const result: T[] = [];
  for (let page = 1; ; page++) {
    const {data} = await github.request<T[]>(route, {...parameters, per_page: 100, page});
    result.push(...data);
    if (data.length < 100) return result;
  }
}

function isMeasurement(run: Run): boolean {
  return (
    run.path.split('@')[0] === '.github/workflows/size.yml' &&
    run.event === 'pull_request' &&
    run.conclusion !== 'cancelled' &&
    SHA.test(run.head_sha)
  );
}

function matches(pull: Pull, run: Run): boolean {
  return (
    pull.state === 'open' &&
    pull.head.sha === run.head_sha &&
    pull.head.ref === run.head_branch &&
    pull.head.repo?.id === run.head_repository.id
  );
}

/** Fork workflow_run events can have an empty pull_requests array. Use API identities, not artifacts. */
async function findPull(
  github: Github,
  repository: Repository,
  run: Run,
): Promise<Pull | undefined> {
  const pulls: Pull[] = [];
  if (run.pull_requests.length) {
    for (const item of run.pull_requests) {
      const {data} = await github.request<Pull>('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        ...repository,
        pull_number: item.number,
      });
      pulls.push(data);
    }
  } else {
    pulls.push(
      ...(await list<Pull>(github, 'GET /repos/{owner}/{repo}/pulls', {
        ...repository,
        state: 'open',
      })),
    );
  }
  const matching = pulls.filter((pull) => matches(pull, run));
  if (matching.length > 1) throw new Error('Cannot unambiguously associate the size run with a PR');
  return matching[0];
}

async function comment(
  github: Github,
  repository: Repository,
  pr: number,
  run: Run,
  content: string,
  pending = false,
): Promise<void> {
  const comments = await list<Comment>(
    github,
    'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
    {...repository, issue_number: pr},
  );
  const previous = comments.find(
    (item) => item.user.login === 'github-actions[bot]' && item.body.startsWith(COMMENT_MARKER),
  );
  const stamp = previous?.body.match(/<!-- size-run:(\d+):(\d+):(pending|complete) -->/);
  if (stamp) {
    const newerRun = Number(stamp[1]) > run.id;
    const sameRun = Number(stamp[1]) === run.id;
    const newerAttempt = sameRun && Number(stamp[2]) > run.run_attempt;
    const alreadyComplete =
      sameRun && Number(stamp[2]) === run.run_attempt && stamp[3] === 'complete' && pending;
    if (newerRun || newerAttempt || alreadyComplete) return;
  }
  const body = `${COMMENT_MARKER}\n<!-- size-run:${run.id}:${run.run_attempt}:${pending ? 'pending' : 'complete'} -->\n${content}`;
  if (previous) {
    await github.request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', {
      ...repository,
      comment_id: previous.id,
      body,
    });
  } else {
    await github.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      ...repository,
      issue_number: pr,
      body,
    });
  }
}

function runLink(repository: Repository, run: Run): string {
  return `https://github.com/${repository.owner}/${repository.repo}/actions/runs/${run.id}`;
}

export async function prepareSizeComment(
  github: Github,
  repository: Repository,
  run: Run,
  action: string,
): Promise<{pr: number; artifact?: number} | undefined> {
  if (!isMeasurement(run)) return undefined;
  const pull = await findPull(github, repository, run);
  if (!pull) return undefined;
  if (action === 'requested') {
    // A delayed requested event must not replace results from the completed run.
    const {data} = await github.request<{status: string}>(
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}',
      {...repository, run_id: run.id},
    );
    if (data.status !== 'completed') {
      await comment(
        github,
        repository,
        pull.number,
        run,
        `### Size report\n\nMeasuring PR \`${run.head_sha}\` against the daily committed main baseline. Previous results are outdated.\n\n[Measurement run](${runLink(repository, run)}). Size changes are informational.`,
        true,
      );
    }
    return undefined;
  }
  if (action !== 'completed') return undefined;
  const {data} = await github.request<{artifacts: Artifact[]}>(
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts',
    {...repository, run_id: run.id, name: 'size-report', per_page: 100},
  );
  const artifacts = data.artifacts.filter(
    (item) =>
      item.name === 'size-report' && !item.expired && item.size_in_bytes <= MAX_REPORT_BYTES,
  );
  return {pr: pull.number, ...(artifacts.length === 1 ? {artifact: artifacts[0]!.id} : {})};
}

async function readReport(
  file: string,
): Promise<{content: string; summary: ReturnType<typeof parseSizeSummary>}> {
  if ((await stat(file)).size > MAX_REPORT_BYTES) throw new Error('Size report exceeds 20 MiB');
  const content = await readFile(file, 'utf8');
  return {content, summary: parseSizeSummary(JSON.parse(content) as unknown)};
}

export async function publishSizeReport(
  github: Github,
  repository: Repository,
  run: Run,
  pr: number,
  reportFile: string,
  baselineFile: string,
): Promise<void> {
  if (!isMeasurement(run)) return;
  const pull = await findPull(github, repository, run);
  if (!pull || pull.number !== pr) return;
  let body: string;
  try {
    // The baseline is read from the publisher's trusted checkout, never from the PR artifact.
    const {summary: before} = await readReport(baselineFile);
    const {summary: after} = await readReport(reportFile);
    body = `Baseline source \`${before.commit}\`, measured ${before.generatedAt}.\n\n${formatSizeComparison(before, after)}`;
    if (run.conclusion !== 'success') {
      body = `The measurement run reported problems. These results may be incomplete.\n\n${body}`;
    }
  } catch {
    body =
      'Size measurement could not complete. The build may have failed, or the report or committed baseline may be missing or invalid. See the run logs for details.';
  }
  const prefix = `### Size report\n\nPR \`${run.head_sha}\` compared with the committed daily main baseline.\n\n[Full JSON report and run logs](${runLink(repository, run)})\n\n`;
  if (body.length > 58_000) {
    body = `${body.slice(0, 57_000)}\n\nReport shortened to fit the PR comment. Full results are attached to the workflow run.`;
  }
  await comment(github, repository, pr, run, prefix + body);
}

/** The daily workflow's separate write job updates this one fixed file through the Contents API. */
export async function commitSizeBaseline(
  github: Github,
  repository: Repository,
  reportFile: string,
  sourceCommit: string,
): Promise<void> {
  if (!SHA.test(sourceCommit)) throw new Error('Invalid source commit');
  const {content, summary} = await readReport(reportFile);
  if (summary.commit !== sourceCommit.slice(0, 12))
    throw new Error('Baseline source commit mismatch');
  const {data: main} = await github.request<{sha: string}>(
    'GET /repos/{owner}/{repo}/commits/main',
    {
      ...repository,
    },
  );
  if (main.sha !== sourceCommit)
    throw new Error('Main changed during measurement. Rerun the baseline workflow.');
  const {data: previous} = await github.request<{sha: string}>(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {...repository, path: BASELINE_PATH, ref: 'main'},
  );
  await github.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    ...repository,
    path: BASELINE_PATH,
    branch: 'main',
    sha: previous.sha,
    message: 'chore: update size baseline',
    content: Buffer.from(content).toString('base64'),
  });
}
