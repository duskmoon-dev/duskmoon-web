# Next.js smoke test

This example exercises `@duskmoon-dev/components` through the public React
exports in a Next.js 16 application.

From the Web repository root:

```sh
bun run build:packages @duskmoon-dev/components
bun run --filter nextjs-15-smoke dev
bun run build:apps nextjs-15-smoke
```
