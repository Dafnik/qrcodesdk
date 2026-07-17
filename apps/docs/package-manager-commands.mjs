/** @typedef {'add' | 'addDev' | 'addGlobal' | 'exec' | 'dlx' | 'label'} PackageManagerMode */

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
    addGlobal: 'deno install --global',
    exec: 'deno x',
    dlx: 'deno x',
  },
  bun: {
    label: 'bun',
    add: 'bun add',
    addDev: 'bun add -D',
    addGlobal: 'bun add -g',
    exec: 'bunx',
    dlx: 'bunx',
  },
  yarn: {
    label: 'yarn',
    add: 'yarn add',
    addDev: 'yarn add -D',
    addGlobal: 'yarn global add',
    exec: 'yarn',
    dlx: 'yarn dlx',
  },
};

/**
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

  if (!Object.values(PACKAGE_MANAGERS).every((commands) => mode in commands)) {
    throw new Error(`Unsupported package manager mode: ${mode}.`);
  }

  const commandTarget = mode === 'exec' ? command : packageList;
  const commandArguments = mode === 'exec' || mode === 'dlx' ? argumentList : '';

  return Object.entries(PACKAGE_MANAGERS).map(([id, commands]) => ({
    id,
    label: commands.label,
    command: [commands[mode], commandTarget, commandArguments]
      .filter((part) => part !== undefined && part.length > 0)
      .join(' '),
  }));
}
