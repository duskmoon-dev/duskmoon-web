---
name: duskmoon-web-development
description: Change and verify Duskmoon Web source in the React, Phoenix, TypeScript Code Engine, or Yew workspaces, including the checks for their shared package boundaries.
---

# Develop Duskmoon Web

Use the [workspace guide](../../../docs/js-workspace.md), [verification guide](../../../docs/verification.md), and repository `AGENTS.md` for the current entry points. Run Bun commands at the repository root and use the affected workspace's package name to focus builds and tests.

## React

Inspect `packages/react/components` or `packages/react/art-components` for public exports, styles, and tests. Verify changes through the published entry points. Run `bun run verify:react-boundary` to check that native React stays independent of Elements.

## Phoenix

Work from `phoenix/` for Mix commands. Run `mix deps.get --check-locked`, then `MIX_ENV=test scripts/with-precompiled-toolchain.sh mix test`. The [renderer audit](../../../phoenix/docs/component-audit.md) maps components to native HEEx, explicit React bridges, and retained Elements. Test focus, dismissal, editing, and hook behavior in a browser when changing those contracts.

## TypeScript Code Engine

```sh
bun run build:packages @duskmoon-dev/el-code-engine
bun run build:apps @duskmoon-dev/code-engine-playground
bun run test:packages @duskmoon-dev/code-engine @duskmoon-dev/el-code-engine
```

Check packed root and subpath exports, shared ESM chunks, and strict Bundler and NodeNext declarations when changing the build or public API. For editor UI changes, exercise editing, language loading, teardown, and remount through the registered adapter.

## Yew

From `yew/`, run `cargo test --locked --workspace --all-features` and `cargo check --locked --workspace --all-features --target wasm32-unknown-unknown` for crate changes. For the hosted demo, build `@duskmoon-dev/core` from the Web root and run `trunk build --release --locked --public-url /yew/` from `yew/example/`. Check navigation and Rust editor Worker assets under the deployment subpath when changing those features.
