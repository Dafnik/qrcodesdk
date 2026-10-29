import {execFile as execFileCallback} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {setTimeout as sleep} from 'node:timers/promises';
import {promisify} from 'node:util';

const execFile = promisify(execFileCallback);

const REMOTE = 'origin';
const MAIN_BRANCH = 'main';
const SCOPE = '@qrcodesdk/';
const POLL_INTERVAL_MS = 15_000;
const TIMEOUT_MS = 20 * 60_000;
const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];

const dryRun = process.argv.includes('--dry-run');
const unknownArguments = process.argv.slice(2).filter((argument) => argument !== '--dry-run');
if (unknownArguments.length > 0) {
  fail(`Unknown arguments: ${unknownArguments.join(' ')}\nUsage: pnpm release:push [--dry-run]`);
}

async function run(command, args) {
  const {stdout} = await execFile(command, args, {maxBuffer: 16 * 1024 * 1024});
  return stdout.trim();
}

async function succeeds(command, args) {
  try {
    await execFile(command, args);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function log(message) {
  const time = new Date().toLocaleTimeString('en-GB', {hour12: false});
  console.log(`[${time}] ${message}`);
}

function parseTag(tag) {
  const match = /^(@qrcodesdk\/[^@]+)@(\d+\.\d+\.\d+.*)$/u.exec(tag);
  return match ? {name: match[1], version: match[2]} : undefined;
}

async function readPackageDirectories() {
  const directories = new Map();
  for (const entry of await readdir('packages', {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join('packages', entry.name, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const {name} = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (name?.startsWith(SCOPE)) directories.set(name, path.posix.join('packages', entry.name));
  }
  return directories;
}

async function readManifestAt(ref, directory) {
  return JSON.parse(await run('git', ['show', `${ref}:${directory}/package.json`]));
}

async function isOnNpm(name, version) {
  const response = await fetch(
    `https://registry.npmjs.org/${name.replace('/', '%2f')}/${encodeURIComponent(version)}`,
    {cache: 'no-store', headers: {accept: 'application/json'}},
  );
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`npm registry responded with ${response.status} for ${name}`);
  return (await response.json()).version === version;
}

async function findWorkflowRun(release) {
  const runs = JSON.parse(
    await run('gh', [
      'run',
      'list',
      '--workflow',
      release.workflow,
      '--event',
      'push',
      '--limit',
      '20',
      '--json',
      'headBranch,headSha,status,conclusion,url',
    ]),
  );
  return runs.find((workflowRun) => workflowRun.headBranch === release.tag);
}

// Collect tags that exist locally but not on the remote.
const localTags = (await run('git', ['tag', '--list', `${SCOPE}*@*`])).split('\n').filter(Boolean);
const remoteTags = new Set(
  (await run('git', ['ls-remote', '--tags', REMOTE, `refs/tags/${SCOPE}*`]))
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t')[1].replace(/^refs\/tags\//u, ''))
    .filter((ref) => !ref.endsWith('^{}')),
);
const pendingTags = localTags.filter((tag) => !remoteTags.has(tag));

if (pendingTags.length === 0) {
  console.log(`No pending ${SCOPE}* tags found.`);
  process.exit(0);
}

const packageDirectories = await readPackageDirectories();

/** @type {Map<string, {tag: string, name: string, version: string, directory: string, workflow: string, commit: string, parents: Map<string, string>}>} */
const releases = new Map();
for (const tag of pendingTags) {
  const parsed = parseTag(tag);
  if (!parsed) fail(`Cannot parse tag ${tag}.`);
  const {name, version} = parsed;
  if (releases.has(name)) {
    fail(
      `Multiple pending tags for ${name}: ${releases.get(name).tag}, ${tag}. Push them manually.`,
    );
  }

  const directory = packageDirectories.get(name);
  if (!directory) fail(`No workspace package found for tag ${tag}.`);
  const workflow = `release-${name.slice(SCOPE.length)}.yml`;
  if (!existsSync(path.join('.github', 'workflows', workflow))) {
    fail(`No release workflow .github/workflows/${workflow} found for ${name}.`);
  }

  const commit = await run('git', ['rev-list', '-n', '1', tag]);
  const manifest = await readManifestAt(commit, directory);
  if (manifest.version !== version) {
    fail(`Tag ${tag} points at a commit where ${name} has version ${manifest.version}.`);
  }

  const parents = new Map();
  for (const field of DEPENDENCY_FIELDS) {
    for (const [dependency, specifier] of Object.entries(manifest[field] ?? {})) {
      if (!dependency.startsWith(SCOPE)) continue;
      const range = specifier.replace(/^workspace:/u, '');
      if (range === '*') {
        const dependencyDirectory = packageDirectories.get(dependency);
        if (!dependencyDirectory) fail(`${name} depends on unknown package ${dependency}.`);
        parents.set(dependency, (await readManifestAt(commit, dependencyDirectory)).version);
      } else if (/^\d+\.\d+\.\d+/u.test(range)) {
        parents.set(dependency, range);
      } else {
        fail(`${name} uses unsupported specifier ${specifier} for ${dependency}.`);
      }
    }
  }

  releases.set(name, {tag, name, version, directory, workflow, commit, parents});
}

// Every tagged commit must already be on the remote main branch.
await run('git', ['fetch', '--quiet', REMOTE, MAIN_BRANCH]);
for (const release of releases.values()) {
  if (
    !(await succeeds('git', [
      'merge-base',
      '--is-ancestor',
      release.commit,
      `${REMOTE}/${MAIN_BRANCH}`,
    ]))
  ) {
    fail(
      `${release.tag} points at ${release.commit.slice(0, 7)}, which is not on ${REMOTE}/${MAIN_BRANCH}. Push ${MAIN_BRANCH} first.`,
    );
  }
}

// Parents outside this batch must already be published.
for (const release of releases.values()) {
  for (const [parent, version] of release.parents) {
    const pendingParent = releases.get(parent);
    if (pendingParent) {
      if (pendingParent.version !== version) {
        fail(
          `${release.tag} needs ${parent}@${version}, but the pending tag is ${pendingParent.tag}.`,
        );
      }
    } else if (!(await isOnNpm(parent, version))) {
      fail(`${release.tag} needs ${parent}@${version}, which is neither on npm nor a pending tag.`);
    }
  }
}

const batchParents = (release) =>
  [...release.parents.keys()].filter((parent) => releases.has(parent));

// Group releases into waves for the overview and detect dependency cycles.
const waves = [];
const placed = new Set();
while (placed.size < releases.size) {
  const wave = [...releases.values()].filter(
    (release) =>
      !placed.has(release.name) && batchParents(release).every((parent) => placed.has(parent)),
  );
  if (wave.length === 0) fail('Dependency cycle between the pending tags.');
  for (const release of wave) placed.add(release.name);
  waves.push(wave);
}

console.log('Tags to push:');
waves.forEach((wave, index) => {
  for (const release of wave) {
    const parents = batchParents(release);
    const after = parents.length > 0 ? ` (after ${parents.join(', ')})` : '';
    console.log(`  ${index + 1}. ${release.tag}${after}`);
  }
});

if (dryRun) {
  console.log('\nDry run: nothing was pushed.');
  process.exit(0);
}

if (!(await succeeds('gh', ['auth', 'status']))) {
  fail('The GitHub CLI (gh) must be installed and logged in to watch the release workflows.');
}

/** @type {Map<string, {state: 'waiting' | 'pushed' | 'ready', pushedAt?: number, runUrl?: string}>} */
const status = new Map([...releases.keys()].map((name) => [name, {state: 'waiting'}]));

function printSummary() {
  console.log('\nSummary:');
  for (const release of releases.values()) {
    const {state, runUrl} = status.get(release.name);
    const label = {ready: 'published', pushed: 'pushed, not yet published', waiting: 'not pushed'}[
      state
    ];
    console.log(`  ${release.tag}: ${label}${runUrl ? ` (${runUrl})` : ''}`);
  }
}

function abort(message) {
  printSummary();
  fail(message);
}

console.log('');
while ([...status.values()].some(({state}) => state !== 'ready')) {
  const readyToPush = [...releases.values()].filter(
    (release) =>
      status.get(release.name).state === 'waiting' &&
      batchParents(release).every((parent) => status.get(parent).state === 'ready'),
  );
  if (readyToPush.length > 0) {
    const tags = readyToPush.map((release) => release.tag);
    log(`Pushing ${tags.join(', ')}`);
    try {
      await run('git', ['push', REMOTE, ...tags.map((tag) => `refs/tags/${tag}`)]);
    } catch (error) {
      abort(`Pushing tags failed: ${error.stderr?.trim() || error.message}`);
    }
    for (const release of readyToPush) {
      Object.assign(status.get(release.name), {state: 'pushed', pushedAt: Date.now()});
    }
  }

  await sleep(POLL_INTERVAL_MS);

  for (const release of releases.values()) {
    const current = status.get(release.name);
    if (current.state !== 'pushed') continue;

    try {
      if (await isOnNpm(release.name, release.version)) {
        current.state = 'ready';
        log(`${release.name}@${release.version} is available on npm`);
        continue;
      }

      const workflowRun = await findWorkflowRun(release);
      if (workflowRun && !current.runUrl) {
        current.runUrl = workflowRun.url;
        log(`${release.tag}: watching ${workflowRun.url}`);
      }
      if (workflowRun?.status === 'completed' && workflowRun.conclusion !== 'success') {
        abort(
          `The release workflow for ${release.tag} ended with "${workflowRun.conclusion}": ${workflowRun.url}`,
        );
      }
    } catch (error) {
      log(`${release.tag}: status check failed, retrying (${error.message})`);
    }

    if (Date.now() - current.pushedAt > TIMEOUT_MS) {
      abort(
        `${release.name}@${release.version} did not appear on npm within ${TIMEOUT_MS / 60_000} minutes.`,
      );
    }
  }
}

printSummary();
console.log('\n✔ All tags pushed and published.');
