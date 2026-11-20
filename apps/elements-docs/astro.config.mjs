import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';
import { rebaseMarkdownLinks } from '../../scripts/pages/markdown-links.mjs';

const defaultBase = '/duskmoon-elements';
const base = process.env.DOCS_BASE ?? defaultBase;

export default defineConfig({
  integrations: [mdx()],
  site: process.env.DOCS_SITE ?? 'https://duskmoon-dev.github.io',
  base,
  output: 'static',
  server: {
    port: 4331,
  },
  vite: {
    optimizeDeps: {
      include: ['mermaid'],
      // Exclude workspace element packages so Vite resolves them from source
      exclude: [
        '@duskmoon-dev/el-markdown',
        '@duskmoon-dev/el-markdown-input',
        '@duskmoon-dev/el-code-engine',
      ],
    },
    resolve: {
      alias: {
        // Point workspace packages to their TypeScript source for live HMR
        '@duskmoon-dev/el-markdown': fileURLToPath(
          new URL('../../packages/elements/components/markdown/src/index.ts', import.meta.url)
        ),
        '@duskmoon-dev/el-markdown-input': fileURLToPath(
          new URL('../../packages/elements/components/markdown-input/src/index.ts', import.meta.url)
        ),
        '@duskmoon-dev/el-code-engine': fileURLToPath(
          new URL('../../packages/elements/components/code-engine/src/index.ts', import.meta.url)
        ),
      },
    },
  },
  markdown: {
    ...(base !== defaultBase && { remarkPlugins: [rebaseMarkdownLinks(defaultBase, base)] }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
});
