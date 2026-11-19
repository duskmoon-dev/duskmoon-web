# Repository Guidelines

## Project Structure

- `packages/css/` holds Core theme tokens, component styles, and CSS Art. `packages/elements/` contains the custom element base, individual elements, and registration bundles. Native React libraries live in `packages/react/`. JavaScript and CSS package sources live under `src/`.
- `apps/` contains docs sites, demos, and starters. Static docs assets live in app-level `public/` directories where present. The Mix workspace under `phoenix/` contains `apps/duskmoon_phoenix` and `apps/duskmoon_storybook`, each with `lib/`, `assets/`, and `test/` directories.

## Build, Test, and Development

Run Bun commands from the repository root using Bun 1.4.0.

- `bun install --frozen-lockfile` installs the locked dependencies.
- `bun run build:packages` builds public libraries in dependency order. `bun run build:apps` builds the docs and demos.
- `bun run --filter @duskmoon-dev/react-docs dev` starts the React docs locally after the libraries are built.
- `bun run test:packages` runs package suites. Append a package name, such as `@duskmoon-dev/el-button`, to focus the run.
- `bun run check:impacted origin/main` builds affected workspaces and runs package tests for committed changes. `bun run verify:react-boundary` checks that native React stays independent of Duskmoon Elements.

## Coding Style and Naming

Use two-space indentation and match nearby formatting. Name React component files in PascalCase (`Button.tsx`) and custom element files and tags in kebab-case (`el-dm-button.ts`, `el-dm-button`). Use each Elements package's `format:check` and `lint:check` scripts where available. Run `mix format` from `phoenix/` for Elixir and Storybook HEEx changes.

## Testing Guidelines

Add regression coverage for behavior changes. Bun unit tests use `*.test.ts` or `*.test.tsx`. Place CSS tests in `tests/unit/` and React and Elements unit tests beside their source files. Run browser suites with Playwright from their workspace, such as `bun run test` in `apps/css-docs/` for `*.spec.ts` tests. Phoenix uses ExUnit and `*_test.exs`. In `phoenix/`, run `mix deps.get --check-locked`, then `MIX_ENV=test scripts/with-precompiled-toolchain.sh mix test`. Root CI has no numeric coverage threshold.

## Commits and Pull Requests

Follow Conventional Commits, for example `fix(input): preserve native control and editing state`. Describe the behavior change, link related issues, and list the checks you ran. Include screenshots for visible changes and confirm the relevant CI checks pass.
