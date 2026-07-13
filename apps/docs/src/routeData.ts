import {defineRouteMiddleware} from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
  const {starlightRoute} = context.locals;

  const related = starlightRoute.entry.data.related;
  const tocItems = starlightRoute.toc?.items;

  if (!tocItems || !related) {
    return;
  }

  starlightRoute.toc?.items.push({
    depth: 0,
    slug: 'related-pages',
    text: 'Related pages',
    children: [],
  });
});
