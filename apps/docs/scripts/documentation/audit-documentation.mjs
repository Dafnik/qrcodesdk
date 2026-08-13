import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {URL, fileURLToPath} from 'node:url';
import YAML from 'yaml';

import {DOCUMENTATION_SIDEBAR} from '../../src/documentation-sidebar.mjs';

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT_ROOT = path.join(DOCS_ROOT, 'src/content/docs');
const DIST_ROOT = path.join(DOCS_ROOT, 'dist');
const SITE_ORIGIN = 'https://qrcodesdk.dev';

export const DOCUMENTATION_TYPES = new Set([
  'concept',
  'guide',
  'overview',
  'package',
  'reference',
  'setup',
]);

export const REMOVED_ROUTE_PREFIXES = [
  '/advanced/custom-renderers',
  '/advanced/customize',
  '/advanced/performance',
  '/explain',
  '/getting-started/credits',
  '/getting-started/installation',
  '/renderers/browser',
  '/renderers/core',
];

const CHANGELOG_ROUTE = /^\/changelog\/(?:angular|browser|core|node|react)(?:\/|$)/;

export async function auditDocumentation({
  contentRoot = CONTENT_ROOT,
  distRoot = DIST_ROOT,
  sidebar = DOCUMENTATION_SIDEBAR,
  siteOrigin = SITE_ORIGIN,
} = {}) {
  const source = await auditDocumentationSource({contentRoot, sidebar});
  const build = await auditDocumentationBuild({
    authoredRoutes: source.authoredRoutes,
    distRoot,
    siteOrigin,
  });
  const issues = [...source.issues, ...build.issues].sort();

  if (issues.length > 0) {
    throw new Error(`Documentation audit failed:\n- ${issues.join('\n- ')}`);
  }

  return {
    authoredPageCount: source.authoredRoutes.size,
    builtRouteCount: build.builtRoutes.size,
  };
}

export async function auditDocumentationSource({contentRoot, sidebar}) {
  const files = (await walkFiles(contentRoot)).filter((file) => /\.mdx?$/.test(file));
  const authoredRoutes = new Set(files.map((file) => routeFromSourceFile(file, contentRoot)));
  const issues = [];

  for (const file of files) {
    const relativeFile = path.relative(contentRoot, file);
    const source = await readFile(file, 'utf8');
    const frontmatter = parseFrontmatter(source, relativeFile, issues);

    if (!DOCUMENTATION_TYPES.has(frontmatter.docType)) {
      issues.push(`${relativeFile}: missing or invalid docType`);
    }

    const absoluteLinks = [
      ...collectAbsoluteFrontmatterLinks(frontmatter),
      ...collectMarkdownLinks(source),
    ];

    for (const link of absoluteLinks) {
      validateAuthoredRoute(link, `${relativeFile}: ${link}`, authoredRoutes, issues);
    }

    for (const related of frontmatter.related ?? []) {
      if (typeof related !== 'string') {
        issues.push(`${relativeFile}: related entries must be strings`);
        continue;
      }

      if (related.startsWith('/')) {
        validateAuthoredRoute(
          related,
          `${relativeFile} related: ${related}`,
          authoredRoutes,
          issues,
        );
        continue;
      }

      const relatedPath = path.resolve(path.dirname(file), related.split(/[?#]/, 1)[0]);
      if (!relatedPath.startsWith(`${path.resolve(contentRoot)}${path.sep}`)) {
        issues.push(`${relativeFile}: related link leaves the content root: ${related}`);
      } else if (!files.includes(relatedPath)) {
        issues.push(`${relativeFile}: related page does not exist: ${related}`);
      }
    }
  }

  const sidebarSlugs = collectSidebarSlugs(sidebar);
  const sidebarRoutes = sidebarSlugs.map((slug) => normalizeRoute(`/${slug}`));
  const seen = new Set();

  for (const route of sidebarRoutes) {
    if (seen.has(route)) issues.push(`sidebar: duplicate route ${route}`);
    seen.add(route);

    if (isRemovedRoute(route)) issues.push(`sidebar: removed route ${route}`);
    if (!authoredRoutes.has(route) && !CHANGELOG_ROUTE.test(route)) {
      issues.push(`sidebar: route does not have a page: ${route}`);
    }
  }

  for (const route of authoredRoutes) {
    if (!seen.has(route)) issues.push(`sidebar: authored route is missing: ${route}`);
  }

  const expectedStart = ['', 'getting-started/choose-your-setup', 'playground'];
  const actualStart = sidebar[0]?.items?.map((item) => item.slug) ?? [];
  if (JSON.stringify(actualStart) !== JSON.stringify(expectedStart)) {
    issues.push(
      `sidebar: first routes must be ${expectedStart.map((slug) => normalizeRoute(`/${slug}`)).join(', ')}`,
    );
  }

  return {authoredRoutes, issues};
}

export async function auditDocumentationBuild({authoredRoutes, distRoot, siteOrigin}) {
  const htmlFiles = (await walkFiles(distRoot)).filter(
    (file) => path.basename(file) === 'index.html',
  );
  const builtRoutes = new Set(htmlFiles.map((file) => routeFromBuiltFile(file, distRoot)));
  const issues = [];

  for (const file of htmlFiles) {
    const route = routeFromBuiltFile(file, distRoot);
    const html = await readFile(file, 'utf8');
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];

    if (!canonical) {
      issues.push(`${route}: canonical tag is missing`);
      continue;
    }

    const canonicalUrl = new URL(canonical);
    const canonicalRoute = normalizeRoute(canonicalUrl.pathname);
    if (canonicalUrl.origin !== siteOrigin || canonicalRoute !== route) {
      issues.push(`${route}: canonical points to ${canonical}`);
    }
    if (!isAllowedBuiltRoute(canonicalRoute, authoredRoutes)) {
      issues.push(`${route}: canonical exposes a route outside the information architecture`);
    }
  }

  const sitemapFiles = (await walkFiles(distRoot)).filter((file) =>
    /^sitemap-\d+\.xml$/.test(path.basename(file)),
  );
  const sitemapRoutes = new Set();

  for (const file of sitemapFiles) {
    const xml = await readFile(file, 'utf8');
    for (const [, location] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = new URL(location);
      const route = normalizeRoute(url.pathname);
      sitemapRoutes.add(route);
      if (url.origin !== siteOrigin) issues.push(`sitemap: unexpected origin in ${location}`);
      if (!isAllowedBuiltRoute(route, authoredRoutes)) {
        issues.push(`sitemap: route is outside the information architecture: ${route}`);
      }
    }
  }

  if (sitemapFiles.length === 0) issues.push('sitemap: no generated route sitemap found');

  for (const route of builtRoutes) {
    if (!sitemapRoutes.has(route)) issues.push(`sitemap: missing built route ${route}`);
  }
  for (const route of sitemapRoutes) {
    if (!builtRoutes.has(route)) issues.push(`sitemap: route has no built page ${route}`);
  }

  return {builtRoutes, issues};
}

export function collectSidebarSlugs(items) {
  return items.flatMap((item) => [
    ...(typeof item.slug === 'string' ? [item.slug] : []),
    ...(Array.isArray(item.items) ? collectSidebarSlugs(item.items) : []),
  ]);
}

function collectAbsoluteFrontmatterLinks(value, key = '') {
  if (typeof value === 'string') {
    return value.startsWith('/') && key !== 'related' ? [value] : [];
  }
  if (Array.isArray(value)) {
    return key === 'related'
      ? []
      : value.flatMap((item) => collectAbsoluteFrontmatterLinks(item, key));
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([childKey, child]) =>
    collectAbsoluteFrontmatterLinks(child, childKey),
  );
}

function collectMarkdownLinks(source) {
  const links = [];
  const patterns = [/\]\((\/[^)\s]+)(?:\s+[^)]*)?\)/g, /href\s*=\s*["'](\/[^"']+)["']/g];
  for (const pattern of patterns) {
    for (const [, link] of source.matchAll(pattern)) links.push(link);
  }
  return links;
}

function isAllowedBuiltRoute(route, authoredRoutes) {
  return authoredRoutes.has(route) || CHANGELOG_ROUTE.test(route);
}

function isRemovedRoute(route) {
  return REMOVED_ROUTE_PREFIXES.some(
    (removed) => route === normalizeRoute(removed) || route.startsWith(`${removed}/`),
  );
}

function normalizeRoute(route) {
  const pathname = new URL(route, SITE_ORIGIN).pathname.replace(/\/{2,}/g, '/');
  return pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`;
}

function parseFrontmatter(source, relativeFile, issues) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    issues.push(`${relativeFile}: frontmatter is missing`);
    return {};
  }

  try {
    return YAML.parse(match[1]) ?? {};
  } catch (error) {
    issues.push(`${relativeFile}: invalid frontmatter (${error.message})`);
    return {};
  }
}

function routeFromBuiltFile(file, distRoot) {
  const directory = path.relative(distRoot, path.dirname(file)).split(path.sep).join('/');
  return normalizeRoute(`/${directory}`);
}

function routeFromSourceFile(file, contentRoot) {
  const relative = path
    .relative(contentRoot, file)
    .replace(/\.mdx?$/, '')
    .split(path.sep)
    .join('/');
  const slug = relative === 'index' ? '' : relative.replace(/\/index$/, '');
  return normalizeRoute(`/${slug}`);
}

function validateAuthoredRoute(link, context, authoredRoutes, issues) {
  const route = normalizeRoute(link.split(/[?#]/, 1)[0]);
  if (isRemovedRoute(route)) issues.push(`${context} links to a removed route`);
  if (!authoredRoutes.has(route) && !CHANGELOG_ROUTE.test(route)) {
    issues.push(`${context} does not resolve to an authored route`);
  }
}

async function walkFiles(root) {
  const entries = await readdir(root, {withFileTypes: true});
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(root, entry.name);
      return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await auditDocumentation();
  console.log(
    `Documentation audit passed: ${result.authoredPageCount} authored pages and ${result.builtRouteCount} built routes.`,
  );
}
