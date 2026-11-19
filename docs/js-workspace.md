# JavaScript workspace

Run Bun commands from the repository root. The JavaScript workspace includes the
public packages and private apps. Phoenix keeps its Mix project under
[`phoenix/`](../phoenix).

```sh
bun install --frozen-lockfile
bun run build:packages
bun run test:packages
bun run verify:react-boundary
bun run check:impacted origin/main
```

For a focused build, pass a package name. The command builds its prerequisites
first. `bun run build:apps` builds the private JavaScript demos and docs. It also
accepts workspace names for a smaller build.

| Workspace | Path | Development command |
| --- | --- | --- |
| Core docs | [apps/css-docs](../apps/css-docs) | `bun run --filter @duskmoon-dev/css-docs dev` |
| Elements docs | [apps/elements-docs](../apps/elements-docs) | `bun run --filter @duskmoon-dev/elements-docs dev` |
| Elements playground | [apps/elements-playground](../apps/elements-playground) | `bun run --filter @duskmoon-dev/playground dev` |
| React docs | [apps/react-docs](../apps/react-docs) | `bun run --filter @duskmoon-dev/react-docs dev` |
| Tailwind, Astro and Next.js examples | [apps](../apps) | See the individual app manifests |

The Core standalone build reads CSS Art source and records both package
versions in its output. Individual Elements libraries depend on Base and may
consume Core, CSS Art or another leaf. Their aggregate workspaces build after
their constituents. Native React Components and Art Components use Core and
CSS Art respectively. The React build verifies its input graph and emitted
imports. The boundary check also walks the installed dependency closure and
scans source and built code for Duskmoon Elements imports, tags and registration.

`bun run plan:impacted <git-base>` prints the affected JS workspaces and the
Phoenix and Yew check flags. Common configuration and the root Bun lockfile
invalidate all consumers. Core CSS changes trigger the Yew demo build, while
changes confined to Phoenix skip the Rust job. Phoenix uses the published
precompiled Bundler toolchain for its verification.

The imported development guides include package-specific conventions.
[Core and CSS Art](reference/css/development.md), [Elements](reference/elements/development.md),
[React](reference/react/README.md).
