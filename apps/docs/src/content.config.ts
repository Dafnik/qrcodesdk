import {docsLoader} from '@astrojs/starlight/loaders';
import {docsSchema} from '@astrojs/starlight/schema';
import {z} from 'astro/zod';
import {defineCollection} from 'astro:content';
import {changelogsLoader} from 'starlight-changelogs/loader';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        packageName: z.string().optional(),
        related: z.array(z.string()).optional(),
      }),
    }),
  }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      {
        provider: 'changeset',
        base: 'changelog/core',
        changelog: '../../packages/core/CHANGELOG.md',
      },
      {
        provider: 'changeset',
        base: 'changelog/browser',
        changelog: '../../packages/browser/CHANGELOG.md',
      },
      {
        provider: 'changeset',
        base: 'changelog/node',
        changelog: '../../packages/node/CHANGELOG.md',
      },
      {
        provider: 'changeset',
        base: 'changelog/react',
        changelog: '../../packages/react/CHANGELOG.md',
      },
      {
        provider: 'changeset',
        base: 'changelog/angular',
        changelog: '../../packages/angular/CHANGELOG.md',
      },
    ]),
  }),
};
