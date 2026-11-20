---
name: create-element
description: Add, change, or remove a Duskmoon Web custom element package, including leaf exports, registration, aggregate integration, demos, and regression checks.
---

# Maintain a Duskmoon Element

Work in [`packages/elements/components`](../../../packages/elements/components) for UI leaves and [`packages/elements/art`](../../../packages/elements/art) for CSS Art leaves. Pick a nearby leaf with the same rendering or interaction pattern before changing the public contract.

## Wire the leaf and its consumers

- Use `@duskmoon-dev/el-<name>` for a component package, `el-dm-<name>` for the tag, and `ElDm<Name>` for the class. Art uses `el-art-` package names and `el-dm-art-` tags. Check the matching aggregate for how the leaf is exported and registered.
- Keep class and type exports in `src/index.ts`. Use the leaf's `register()` and its `/register` entry for guarded browser registration. Preserve declared attributes, property types, emitted values, and shadow parts when existing consumers rely on them.
- When installing shared Core or CSS Art styles in Shadow DOM, follow the neighboring leaf's stylesheet handling. Include any required rules outside the cascade layer, such as registered custom properties.
- For package additions or removals, update the affected aggregate exports, dependency entries and build externals, docs and playground imports, the public release inventory, and the Bun lockfile. Match `VERSION` for the new package and its Web dependencies.
- For behavior changes, update the relevant usage in `apps/elements-docs` and the reproducing playground page where one exists. Review the [consumer element catalog](../../../skills/duskmoon-elements/references/element-catalog.md) when registration changes and align it with the published tags.

## Verify from the Web root

```sh
bun run build:packages @duskmoon-dev/el-button
bun run test:packages @duskmoon-dev/el-button
bun run --filter @duskmoon-dev/el-button format:check
bun run --filter @duskmoon-dev/el-button lint:check
```

Substitute the affected leaf. When aggregate entries change, build the aggregate as well. For a behavioral change, exercise the registered component through its normal browser entry, especially focus, sizing, and event propagation. Run `node scripts/release.mjs check` when changing the package inventory or same-group dependencies.
