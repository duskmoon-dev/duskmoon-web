---
name: cmd-update-project-docs
description: Refresh Duskmoon Web documentation or skills against current workspace paths, published package exports, and verified consumer examples.
---

# Refresh Duskmoon Web documentation

Use the requested family or files to scope the update. Treat versioned migration notes and historical reports as records of those revisions. Look up current routes, commands and versions in the related workspace manifest, package source, and tests.

- Check package identity, exports, peer dependencies, and [the coordinated inventory](../../../docs/package-inventory.json) before writing installation or import instructions.
- Update [consumer skills](../../../skills/README.md) against the corresponding published package and versioned docs. Keep their relative references inside each skill bundle. Update repository workflows in the [development skills](../README.md).
- For Phoenix, check the [getting started guide](../../../phoenix/apps/duskmoon_phoenix/guides/getting-started.md), the [renderer audit](../../../phoenix/docs/component-audit.md), and the HEEx `attr` and `slot` declarations. Describe native HEEx first and include the feature assets each optional integration needs.
- Check changed imports against package metadata and run a build or type check for executable examples when available. Verify registration, interaction, or CSS against the actual docs or Storybook route when the docs require it.
