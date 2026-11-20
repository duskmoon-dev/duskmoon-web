import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pkg from '../../packages/engines/code-engine/package.json'

const sourceRoot = new URL('../../packages/engines/code-engine/src/', import.meta.url)
const engine = pkg.name
const legacyPrefix = engine + '/lang/legacy/'

export default defineConfig({
  output: 'static',
  site: process.env.DOCS_SITE ?? 'https://duskmoon-dev.github.io',
  base: process.env.DOCS_BASE ?? '/duskmoon-web/code-engine/',
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: {
    plugins: [{
      name: 'code-engine-source-alias',
      apply: 'serve',
      enforce: 'pre',
      resolveId(specifier) {
        if (specifier !== engine && !specifier.startsWith(engine + '/')) return
        if (specifier.startsWith(legacyPrefix)) {
          const module = specifier.slice(legacyPrefix.length)
          if (!/^[-\w]+$/.test(module)) return
          const file = fileURLToPath(new URL(`lang/legacy/${module}.js`, sourceRoot))
          return existsSync(file) ? file : fileURLToPath(new URL(`lang/legacy/${module}.ts`, sourceRoot))
        }
        const subpath = specifier === engine ? '.' : '.' + specifier.slice(engine.length)
        const target = pkg.exports[subpath as keyof typeof pkg.exports]?.import
        if (target) return fileURLToPath(new URL(target.replace(/^\.\/dist\//, '').replace(/\.js$/, '.ts'), sourceRoot))
      },
    }],
    resolve: {
      // Generated grammar files import adjacent TypeScript modules.
      extensions: ['.mts', '.ts', '.mjs', '.js', '.jsx', '.tsx', '.json'],
    },
  },
})
