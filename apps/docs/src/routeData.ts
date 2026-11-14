import {defineRouteMiddleware} from '@astrojs/starlight/route-data';
import {getCollection} from 'astro:content';

import {assertRelatedPagesResolved, resolveRelatedPages} from './utils/related-pages.mjs';

export const onRequest = defineRouteMiddleware(async (context) => {
  const {starlightRoute} = context.locals;
  const {entry} = starlightRoute;

  if (!entry.data.related?.length) {
    return;
  }

  const {resolved, unresolved} = resolveRelatedPages(entry, await getCollection('docs'));
  assertRelatedPagesResolved(entry, unresolved);

  // The footer renders the "Related pages" section only when at least one page resolves.
  if (resolved.length > 0) {
    starlightRoute.toc?.items.push({
      depth: 0,
      slug: 'related-pages',
      text: 'Related pages',
      children: [],
    });
  }
});
