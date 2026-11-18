# Duskmoon Web

Duskmoon Web delivers Core/Tailwind, CSS Art, Custom Elements, native React, and Phoenix components. Each package is independently installable. The public Web packages publish together at the version in [VERSION](VERSION).

| Use | Packages |
| --- | --- |
| Tailwind and CSS | `@duskmoon-dev/core`, optional `@duskmoon-dev/css-art` |
| Custom Elements | `@duskmoon-dev/elements`, `@duskmoon-dev/art-elements`, or individual `@duskmoon-dev/el-*` packages |
| Native React | `@duskmoon-dev/components`, optional `@duskmoon-dev/art-components` |
| Phoenix LiveView | `duskmoon_phoenix` on Hex and npm |
| Hologram | Core/Tailwind styles and native Hologram templates |

The Phoenix library defaults to native HEEx and lightweight hooks. LiveView can mount the native React Form and Chat through explicit feature imports. The React packages use Core styling and React peers. The Elements registrations are standalone. The Hologram compiler and runtime are released through [Duskmoon Bundler](https://github.com/duskmoon-dev/duskmoon-bundler).

## Development

```sh
bun install --frozen-lockfile
bun run build:packages
bun run test:packages
bun run verify:react-boundary
```

`packages/` contains the JS libraries. `apps/` contains the JS demos, docs sites, and starters. The `phoenix/` Mix workspace contains the Phoenix library and Storybook, which includes Hologram examples.

- [Workspace layout and JS checks](docs/js-workspace.md)
- [Source history and migration](docs/migration.md)
- [Public package inventory](docs/package-inventory.json)
- [Release and recovery](docs/release.md)
- [Phoenix 10 to 11 consumer migration](phoenix/apps/duskmoon_phoenix/guides/migrating-to-v11.md)
- [Phoenix renderers and retained integrations](phoenix/docs/component-audit.md)
- [React Form and Chat bridge contracts](docs/bridge.md)
- [Verification and reproduction](docs/verification.md)
- [Storybook production measurements](docs/performance.md)
