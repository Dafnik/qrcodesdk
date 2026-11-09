import path from 'node:path';

/**
 * @typedef {{id: string, filePath?: string, data: {title?: string, related?: string[]}}} RelatedDocument
 * @typedef {{source: string, id: string, title: string, suffix: string}} ResolvedRelatedPage
 */

/**
 * Resolves the `related` front matter paths of a document. Each path is relative to the document's
 * source file, such as `../custom-renderers.md` from `reference/renderers/index.mdx`, and may end
 * with a query string or fragment. Paths are matched against the source files of `documents`, so
 * index pages resolve from their own directory rather than from their route.
 *
 * @param {RelatedDocument} document
 * @param {readonly RelatedDocument[]} documents
 * @returns {{resolved: ResolvedRelatedPage[], unresolved: string[]}}
 */
export function resolveRelatedPages(document, documents) {
  /** @type {ResolvedRelatedPage[]} */
  const resolved = [];
  /** @type {string[]} */
  const unresolved = [];
  const related = document.data.related ?? [];

  if (related.length > 0 && !document.filePath) {
    return {resolved, unresolved: [...related]};
  }

  for (const relatedPath of related) {
    const suffixIndex = relatedPath.search(/[?#]/);
    const pathname = suffixIndex === -1 ? relatedPath : relatedPath.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? '' : relatedPath.slice(suffixIndex);
    const targetPath = path.posix.join(
      path.posix.dirname(toPosixPath(/** @type {string} */ (document.filePath))),
      pathname,
    );
    const target = documents.find(
      (candidate) => candidate.filePath && toPosixPath(candidate.filePath) === targetPath,
    );

    if (target) {
      resolved.push({
        source: relatedPath,
        id: target.id,
        title: target.data.title ?? target.id,
        suffix,
      });
    } else {
      unresolved.push(relatedPath);
    }
  }

  return {resolved, unresolved};
}

/**
 * Throws when a document lists related paths that do not match a source file.
 *
 * @param {RelatedDocument} document
 * @param {readonly string[]} unresolved
 */
export function assertRelatedPagesResolved(document, unresolved) {
  if (unresolved.length > 0) {
    throw new Error(
      `${document.filePath ?? document.id} lists related pages that do not exist: ${unresolved.join(', ')}. Paths are relative to the source file.`,
    );
  }
}

/** @param {string} filePath */
function toPosixPath(filePath) {
  return path.posix.normalize(filePath.replaceAll('\\', '/'));
}
