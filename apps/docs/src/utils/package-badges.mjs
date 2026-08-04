const BADGE_COLOR = '7469B6';
const BUNDLE_EXTERNALS =
  '%22rxjs%22,%22@angular/core%22,%22@angular/common%22,%22pngjs%22,%22react%22,%22react-dom%22';

/**
 * @typedef {{
 *   alt: string,
 *   imageUrl: string,
 *   href?: string,
 * }} PackageBadge
 */

/** @param {string} packageName */
export function createBundleJsUrl(packageName) {
  return `https://deno.bundlejs.com?q=${packageName}&treeshake=[*]&config={%22esbuild%22:{%22external%22:[${BUNDLE_EXTERNALS}]}}`;
}

/**
 * @param {string} packageName
 * @param {{ bundledSize?: string }} [options]
 * @returns {PackageBadge[]}
 */
export function createPackageBadges(packageName, options = {}) {
  const packageDirectory = packageName.split('/').at(-1);

  if (!packageDirectory) {
    throw new Error('Package name must include a package directory.');
  }

  const packageBadge = {
    alt: `Open ${packageName} on npmx.dev`,
    imageUrl: createBadgeImageUrl(packageName, {endpoint: 'name'}),
    href: `https://npmx.dev/${packageName}`,
  };
  const badges = [
    createBadge(packageName, {
      label: 'version',
      endpoint: 'version',
    }),
    createBadge(packageName, {
      label: 'install size',
      endpoint: 'size',
    }),
  ];

  if (options.bundledSize !== undefined) {
    badges.push(
      createBadge(packageName, {
        label: 'bundled size',
        value: options.bundledSize,
        endpoint: 'name',
        href: createBundleJsUrl(packageName),
      }),
    );
  }

  badges.push(
    createBadge(packageName, {
      label: 'download/mo',
      endpoint: 'downloads-month',
    }),
    createBadge(packageName, {
      label: 'source code',
      value: 'GitHub ↗',
      endpoint: 'name',
      href: `https://github.com/Dafnik/qrcodesdk/tree/main/packages/${packageDirectory}`,
    }),
  );

  return [packageBadge, ...badges];
}

/**
 * @param {string} packageName
 * @param {{ label: string, value?: string, endpoint: string, href?: string }} options
 * @returns {PackageBadge}
 */
function createBadge(packageName, {label, value, endpoint, href}) {
  return {
    alt: `${packageName} ${label}`,
    imageUrl: createBadgeImageUrl(packageName, {label, value, endpoint}),
    ...(href ? {href} : {}),
  };
}

/**
 * @param {string} packageName
 * @param {{ label?: string, value?: string, endpoint: string }} options
 */
function createBadgeImageUrl(packageName, {label, value, endpoint}) {
  return `https://npmx.dev/api/registry/badge/${endpoint}/${packageName}?color=${BADGE_COLOR}${label ? `&label=${encodeURIComponent(label)}` : ''}${value ? `&value=${encodeURIComponent(value)}` : ''}&style=shieldsio`;
}
