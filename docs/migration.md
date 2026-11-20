# Duskmoon Web migration

The Web repository brings Core and CSS Art, Custom Elements, native React, Phoenix, Yew, and the standalone TypeScript Code Engine into one coordinated release. Packages retain their published identities except for Phoenix, which moves to the `duskmoon_phoenix` identity on Hex and npm and to the `DuskmoonPhoenix` Elixir namespace.

## Implementation sequence

1. Verify the source heads and registry inventory, then import the complete Git histories.
2. Relocate the public packages and demos, consolidate Bun, and keep bounded Mix and Cargo workspaces for Phoenix and Yew.
3. Align all public distributions to one Web version. Build and exercise the normal entry points before staging an immutable artifact set.
4. Switch Phoenix's default UI to native HEEx and lightweight hooks. Exercise React and the retained Elements integrations through explicit feature entry points.
5. Verify external consumers and the release workflow, including an interrupted publication and resume.

## History

The import commits have two parents. Their second parent is the verified upstream `main` head, and the import commit trees contain the original upstream trees under `_migration/`. Subsequent commits relocate the packages. Original commit IDs are available in the Web history. Existing upstream tags, repositories, and registry artifacts retain their own identities.

| Source | Verified main | Import prefix |
| --- | --- | --- |
| [duskmoonui](https://github.com/duskmoon-dev/duskmoonui) | `204ef29f553e008ee2f5085cc2aadb137e09c9f6` | `_migration/core` |
| [duskmoon-elements](https://github.com/duskmoon-dev/duskmoon-elements) | `f3911402dde9a4db7c7619553b32eb54da614772` | `_migration/elements` |
| [duskmoon-react](https://github.com/duskmoon-dev/duskmoon-react) | `1197b9553884542854c35ad61f26d73691cbcf0b` | `_migration/react` |
| [phoenix-duskmoon-ui](https://github.com/duskmoon-dev/phoenix-duskmoon-ui) | `b115f533c24587c0b6ea8ca1ec3598d9e782863a` | `_migration/phoenix` |
| [yew-duskmoon-ui](https://github.com/duskmoon-dev/yew-duskmoon-ui) | `fa187c524dc5fab5a044d5d5e0aac3dca4c2e0da` | `_migration/yew` |
| [code-engine](https://github.com/duskmoon-dev/code-engine) | `5ef45948b1498d150435eb15275d5c714c9551a8` | `_migration/code-engine` |

GitHub resolved the old `duskmoon-dev/custom-elements` name to `duskmoon-dev/duskmoon-elements`. The first imports began in a local checkout with an unborn `main`. The incremental Code Engine import extends the existing `duskmoon-dev/duskmoon-web` main history at `734524f74bbbf8415bc7c17cad92aa0560a92ac1`.

Design and the Bundler toolchain retain their release schedules. The Hologram examples use Core styles and native Hologram actions. The Hologram fork, compiler, and runtime are supplied by Bundler.

## Package and demo relocation

The [package inventory](package-inventory.json) maps the npm, Hex, and crates.io distributions to their original manifests and trees. It records source assets, runtime and peer requirements, validation commands, documentation and license evidence, as well as observed registry versions. The Yew crates retain GPL-3.0 and Code Engine ships the bundled resources' third-party notices. The imported Elements README identifies MIT. Several upstream Elements and React manifests omit individual license fields and their source trees have no standalone license file.

| Source tree | Destination |
| --- | --- |
| Core `packages/{core,css-art}` | `packages/css/{core,css-art}` |
| Core docs and examples | `apps/css-docs`, `apps/css-demo`, `apps/astro-starter`, `apps/nextjs-starter` |
| Elements `packages/{base,elements,art-elements}` | `packages/elements/{base,elements,art-elements}` |
| Elements `elements/*`, `art-elements/*` | `packages/elements/components/*`, `packages/elements/art/*` |
| Elements docs and playground | `apps/elements-docs`, `apps/elements-playground` |
| React `packages/{components,art-components}` | `packages/react/{components,art-components}` |
| React docs and Next.js sample | `apps/react-docs`, `apps/react-nextjs-smoke` |
| Phoenix `apps/phoenix_duskmoon` | `phoenix/apps/duskmoon_phoenix` |
| Phoenix Storybook and embedded Hologram demo | `phoenix/apps/duskmoon_storybook` |
| Yew `packages/duskmoon` and `packages/code-engine` | `yew/packages/duskmoon` and `yew/packages/code-engine` |
| Private Yew Trunk demo | `yew/example` |
| Code Engine root, including grammars, generated parsers, build and sync tools | `packages/engines/code-engine` |
| Code Engine `playground/` | `apps/code-engine-playground` |

The incremental import commit is `ce5f3c11a57383b69a4fd7fa3a6a8d92c10365de`.
The npm engine retains its MIT and upstream notices. The existing npm adapter
ships an exact dependency on the coordinated engine version. The crates.io
`code-engine` keeps its Rust implementation, Cargo dependency graph, and license.
The engine and private playground resolve through the Web Bun lock. The source
repository's lockfiles and workflows remain accessible in its original history.

The import can be recreated on a clean target with `git fetch --no-tags <source> refs/heads/main:<local-import-ref>`, then `git merge --allow-unrelated-histories -s ours --no-commit <verified-sha>`, `git read-tree --prefix=_migration/<family>/ -u <verified-sha>`, and `git commit`. Use an explicit verified SHA. Core and React visual assets use Git LFS. Their reachable LFS objects were fetched from the corresponding original endpoints during the earlier migration.

Check ancestry with `git merge-base --is-ancestor <source-sha> HEAD`. Check the imported tree with `git rev-parse <import-commit>:_migration/<family>` and compare it to `git rev-parse <source-sha>^{tree}`.
