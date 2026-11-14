/** @typedef {'add' | 'addDev' | 'addGlobal' | 'exec' | 'dlx' | 'label'} PackageManagerMode */

/**
 * A manager without a command for a mode is left out of that mode's tabs.
 * @typedef {{label: string} & Partial<Record<Exclude<PackageManagerMode, 'label'>, string>>} PackageManagerCommands
 */

/** @type {readonly PackageManagerMode[]} */
const PACKAGE_MANAGER_MODES = ['add', 'addDev', 'addGlobal', 'exec', 'dlx', 'label'];

/** @type {Record<string, PackageManagerCommands>} */
export const PACKAGE_MANAGERS = {
  npm: {
    label: 'npm',
    add: 'npm install',
    addDev: 'npm install -D',
    addGlobal: 'npm install -g',
    exec: 'npx',
    dlx: 'npx',
  },
  pnpm: {
    label: 'pnpm',
    add: 'pnpm add',
    addDev: 'pnpm add -D',
    addGlobal: 'pnpm add -g',
    exec: 'pnpm exec',
    dlx: 'pnpm dlx',
  },
  viteplus: {
    label: 'vp',
    add: 'vp add',
    addDev: 'vp add -D',
    addGlobal: 'vp install -g',
    exec: 'vp exec',
    dlx: 'vp dlx',
  },
  deno: {
    label: 'deno',
    add: 'deno add',
    addDev: 'deno add --dev',
    // Deno grants no permissions by default. The CLI reads NO_COLOR and writes output files.
    addGlobal: 'deno install --global --allow-read --allow-write --allow-env',
    exec: 'deno x --allow-read --allow-write --allow-env',
    dlx: 'deno x --allow-read --allow-write --allow-env',
  },
  bun: {
    label: 'bun',
    add: 'bun add',
    addDev: 'bun add -D',
    addGlobal: 'bun add -g',
    exec: 'bunx',
    dlx: 'bunx',
  },
  // Commands for Yarn 2 and newer, which removed `yarn global`. Global installs leave Yarn out;
  // the docs point Yarn users to `yarn dlx` or a project dependency instead.
  // https://yarnpkg.com/migration/guide#use-yarn-dlx-instead-of-yarn-global
  yarn: {
    label: 'yarn',
    add: 'yarn add',
    addDev: 'yarn add -D',
    exec: 'yarn',
    dlx: 'yarn dlx',
  },
};

/**
 * Returns one command per package manager that supports `mode`. Managers without that mode, such as
 * Yarn for `addGlobal`, are left out.
 *
 * @param {{ packages: string[], mode: PackageManagerMode, command?: string, args?: string[] }} options
 */
export function createPackageManagerCommands({packages, mode, command, args = []}) {
  const packageList = packages.join(' ');
  const argumentList = args.join(' ');

  if (mode === 'exec' && command === undefined) {
    throw new Error('PackageManagerTabs requires a command when mode is "exec".');
  }

  if (mode === 'dlx' && packageList.length === 0) {
    throw new Error('PackageManagerTabs requires at least one package when mode is "dlx".');
  }

  if (!PACKAGE_MANAGER_MODES.includes(mode)) {
    throw new Error(`Unsupported package manager mode: ${mode}.`);
  }

  const commandTarget = mode === 'exec' ? command : packageList;
  const commandArguments = mode === 'exec' || mode === 'dlx' ? argumentList : '';

  return Object.entries(PACKAGE_MANAGERS).flatMap(([id, commands]) => {
    const prefix = commands[mode];

    if (prefix === undefined) return [];

    let target = commandTarget;
    let name = '';

    if (id === 'deno') {
      // Deno resolves unprefixed names as npm packages only since 2.8, so always use npm:.
      const npmPackages = packages.map((name) => `npm:${name}`);

      if ((mode === 'exec' || mode === 'dlx') && packages.length === 1 && command !== undefined) {
        target = `${npmPackages[0]}/${command}`;
      } else if (mode !== 'exec') {
        target = npmPackages.join(' ');
      }

      // Without --name, Deno derives the executable name from the package name instead of its bin.
      if (mode === 'addGlobal' && command !== undefined) {
        name = `--name ${command}`;
      }
    }

    return [
      {
        id,
        label: commands.label,
        command: [prefix, name, target, commandArguments]
          .filter((part) => part !== undefined && part.length > 0)
          .join(' '),
      },
    ];
  });
}
