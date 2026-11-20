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
| Code Engine playground | [apps/code-engine-playground](../apps/code-engine-playground) | `bun run --filter @duskmoon-dev/code-engine-playground dev` |
| React docs | [apps/react-docs](../apps/react-docs) | `bun run --filter @duskmoon-dev/react-docs dev` |
| Tailwind, Astro and Next.js examples | [apps](../apps) | See the individual app manifests |

The Core standalone build reads CSS Art source and records both package
versions in its output. Individual Elements libraries depend on Base and may
consume Core, CSS Art or another leaf. Their aggregate workspaces build after
their constituents. Native React Components and Art Components use Core and
CSS Art respectively. The React build verifies its input graph and emitted
imports. The boundary check also walks the installed dependency closure and
scans source and built code for Duskmoon Elements imports, tags and registration.

The npm Code Engine builds under `packages/engines/code-engine`. The adapter
externalizes it, the Elements aggregate uses the adapter, and Phoenix Storybook
loads the adapter on editor routes. Engine changes reach these dependents and
both playgrounds through workspace metadata. Engine-only source changes select
the existing Phoenix checks and skip the Rust job.

Build the private editor demo with
`bun run build:apps @duskmoon-dev/code-engine-playground`. Development resolves
engine imports against source. Production uses the same built ESM and language
chunks shipped in the npm tarball. The default deployment path is
`/duskmoon-web/code-engine/`. Set `DOCS_SITE` and `DOCS_BASE` to match the
deployment origin and path when hosting it elsewhere.

## GitHub Pages

The **Deploy Duskmoon Web Pages** workflow builds after **Web release** publishes
successfully. It selects the highest published Web version, including release
candidates, and checks out the tag that matches the attached release manifest.
It builds the Core, Elements, and React docs, the Code
Engine and Elements playgrounds, the Tailwind and Yew demos, both starter
projects, and the React/Next.js example. The sites share a
[navigation page](https://duskmoon-dev.github.io/duskmoon-web/). Phoenix runs
separately in its Mix workspace.

Build the same static tree locally with Node, Bun, Trunk 0.21.14, and the Rust
`wasm32-unknown-unknown` target installed.

```sh
bun install --frozen-lockfile
preview=$(mktemp -d)
PAGES_ORIGIN=http://localhost:8000 bun scripts/pages/build.mjs "$preview/duskmoon-web"
python3 -m http.server 8000 --directory "$preview"
```

Open `http://localhost:8000/duskmoon-web/` to check the navigation and each
project's subpath. The workflow gets the actual origin and base path from the
GitHub Pages configuration. It uses Next.js static exports and Yew hash routing
for the hosted builds.

## Change impact

`bun run plan:impacted <git-base>` prints the affected JS workspaces and the
Phoenix and Yew check flags. Common configuration and the root Bun lockfile
invalidate all consumers. Core CSS changes trigger the Yew demo build, while
changes confined to Phoenix skip the Rust job. Phoenix uses the published
precompiled Bundler toolchain for its verification.

The imported development guides include package-specific conventions.
[Core and CSS Art](reference/css/development.md), [Elements](reference/elements/development.md),
[React](reference/react/README.md).
