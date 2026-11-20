---
name: css-art
description: Add or maintain a stylesheet in the Duskmoon Web CSS Art source package, including required markup, public CSS variables, and the Core docs demos.
---

# Author CSS Art in Duskmoon Web

Edit [`packages/css/css-art/src/art`](../../../packages/css/css-art/src/art). Inspect a comparable piece and its docs to identify the markup, variable defaults, motion, and semantic controls. Use `@layer css-art`, an `art-<name>` root class, and documented custom properties for configuration.

For a new piece, add the stylesheet to `src/art/index.css`. The CSS Art build discovers individual files and emits the matching public `/dist/art/<name>.css` entry. Document the required DOM, modifiers and public variables in `apps/css-docs/src/content/docs/en/css-art`. Update the docs sidebar and the CSS Art index at `apps/css-docs/src/pages/css-art/index.astro` when adding or relocating a page.

Find existing React, Elements or Phoenix consumers of the piece before changing its markup contract. Update affected consumers within the task's scope. Keep reduced-motion support and check decorative labeling, native controls, and repeat instances where relevant.

```sh
bun run build:packages @duskmoon-dev/css-art
bun run test:packages @duskmoon-dev/css-art
bun run build:apps @duskmoon-dev/css-docs
```

Preview the actual docs markup at the supported sizes. Use [the consumer art catalog](../../../skills/duskmoon-dev-css-art/references/art.md) to keep public examples consistent.
