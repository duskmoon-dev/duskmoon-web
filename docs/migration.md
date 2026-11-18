# Duskmoon Web migration

The Web repository brings Core and CSS Art, Custom Elements, native React, and Phoenix into one coordinated release. Packages retain their published identities except for Phoenix, which moves to the `duskmoon_phoenix` identity on Hex and npm and to the `DuskmoonPhoenix` Elixir namespace.

## Implementation sequence

1. Verify the source heads and registry inventory, then import the complete Git histories.
2. Relocate the public packages and demos, consolidate Bun, and keep an isolated Mix project for Phoenix and its examples.
3. Align all public distributions to one Web version. Build and exercise the normal entry points before staging an immutable artifact set.
4. Switch Phoenix's default UI to native HEEx and lightweight hooks. Exercise React and the retained Elements integrations through explicit feature entry points.
5. Verify external consumers and the release workflow, including an interrupted publication and resume.

## History

The four import commits have two parents. Their second parent is the verified upstream `main` head, and the import commit trees contain the original upstream trees under `_migration/`. Subsequent commits relocate the packages. Original commit IDs are available in the Web history. Existing upstream tags, repositories, and registry artifacts retain their own identities.

| Source | Verified main | Import prefix |
| --- | --- | --- |
| [duskmoonui](https://github.com/duskmoon-dev/duskmoonui) | `204ef29f553e008ee2f5085cc2aadb137e09c9f6` | `_migration/core` |
| [duskmoon-elements](https://github.com/duskmoon-dev/duskmoon-elements) | `f3911402dde9a4db7c7619553b32eb54da614772` | `_migration/elements` |
| [duskmoon-react](https://github.com/duskmoon-dev/duskmoon-react) | `1197b9553884542854c35ad61f26d73691cbcf0b` | `_migration/react` |
| [phoenix-duskmoon-ui](https://github.com/duskmoon-dev/phoenix-duskmoon-ui) | `b115f533c24587c0b6ea8ca1ec3598d9e782863a` | `_migration/phoenix` |

GitHub resolved the old `duskmoon-dev/custom-elements` name to `duskmoon-dev/duskmoon-elements`. The local target had an unborn `main` and no configured remote. Both Git and the authenticated repository API returned “Repository not found” for the target, so remote history and access remain unverified.

Design and the Bundler toolchain retain their release schedules. The Hologram examples use Core styles and native Hologram actions. The Hologram fork, compiler, and runtime are supplied by Bundler.
