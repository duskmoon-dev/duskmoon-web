# Web release verification

## Reproduce

- From the Web root, run `bun install --frozen-lockfile`, `bun run build:packages`, `bun run test:packages`, and `bun run verify:react-boundary`.
- Run `bun scripts/js/workspace.mjs plan <base-sha>` to see the packages affected by a change. Run the same command with `check` to build prerequisites and run tests for the affected JS packages.
- In `phoenix/`, run `mix deps.get --check-locked`, `elixir scripts/check-toolchain.exs`, and `scripts/with-precompiled-toolchain.sh mix test`. Build demo assets with `scripts/with-precompiled-toolchain.sh mix storybook.assets`. The Web CI runner uses Elixir 1.18 with OTP 28.
- Follow [release staging](release.md) to package and audit the published entry points, run clean consumers, and simulate recovery after the registry accepts a package but the caller loses the response.
- Use [the Hologram example](../phoenix/docs/hologram-example.md) for the shared layout, navigation, theme and renderer ownership checks. Hologram starts only in the enabled Storybook example.

## Code Engine integration

- Run `bun run build:packages @duskmoon-dev/el-code-engine` to build the engine,
  Base and adapter in dependency order. Run
  `bun run build:apps @duskmoon-dev/code-engine-playground` before the package
  tests to exercise the relocated demo's generated pages and split output.
- Run `bun run test:packages @duskmoon-dev/code-engine @duskmoon-dev/el-code-engine`.
  The engine build typechecks the engine. Run
  `bun run --filter @duskmoon-dev/el-code-engine typecheck` for the adapter.
- After staging, run
  `CHROME_BIN=/path/to/chrome node scripts/verify-consumers.mjs STAGE --engine-only`.
  The first isolated install tests every concrete export, including legacy
  modes, shared ESM chunks, and strict Bundler and NodeNext declarations.
  The second installs the exact-version engine with Element Base, the adapter,
  and Core theme assets. The desktop fixture checks shared extension identity,
  editing and history, language chunk requests and syntax, themes and layout
  across ShadowRoots, delayed configuration across remounts, and startup on a
  page without an editor.
- Run `node scripts/release.mjs dry-run STAGE SHA` to verify staged bytes and
  resume the simulation immediately after the npm engine and after the
  separately released Rust engine.

The imported stylesheet reuse fix covers multiple editor ShadowRoots
([#9](https://github.com/duskmoon-dev/code-engine/issues/9)). The adapter's
flex layout fills the default minimum height and scrolls inside bounded
hosts ([#10](https://github.com/duskmoon-dev/code-engine/issues/10)). The packed
Chrome fixture verifies both paths, so Storybook uses the normal on-demand
registration without its prototype patch or injected layout styles.

## Earlier local migration checks

The four source tips resolve as ancestors of the Web checkout. Each import tree matched its original source tree. Git LFS verified the Core and React source tips, and their historical LFS objects were fetched from the original remotes.

An external npm consumer installed the Core, CSS Art, React Components and React Art archives. Strict NodeNext TypeScript resolution, the native button and CSS Art server render, and a consumer bundle run passed. The consumer installed one `react` and one `react-dom` package and no Duskmoon Elements packages.

All 94 public JS libraries and 8 JS demos built locally. The full JS package test command passed 5,036 tests across 58 suites. The inventory includes packages without their own test suites.

One clean npm install resolved all 95 Web tarballs at 11.0.0. The packaged Phoenix Chat/React Composer fixture passed eight bridge tests in clean plain and rich consumers. The plain consumer resolves without Lexical and the rich editor uses a single Lexical runtime.

The standalone Phoenix fixture installed the renamed npm tarball and compiled the library unpacked from the Hex archive. It resolved the CSS and both SVG export patterns and showed the Home icon in the server HTML. On desktop Chrome the native click delivered one event. The browser blocked submission with the required input empty. A valid submission reached LiveView once and carried the external submitter `commit=publish` and nested `sample[name]=Duskmoon`. Chrome requested the document, `app.css`, and `app.js`, then connected to LiveView. The native build and installed package list contain neither React nor Duskmoon Elements.

Phoenix ExUnit passed 3,122 non-browser tests with 31 integration-tagged tests excluded. A focused button, menu and tab run passed 141 tests. In desktop Chrome, the native menu skipped a disabled item, emitted one selection value and restored focus on selection and Escape. Tabs navigated with arrows and End, wrapped, and kept the active panel and both ARIA references synchronized.

Chrome verified the Hologram Storybook example on the production build. Native and Hologram content used the shared shell, the iframe hydrated in isolation, the counter updated through the dialog, focus returned to its trigger, and the Moonlight theme and tasks navigation worked without replacing the sidebar. The Hologram desktop suite passed 23 tests with 3 viewport-specific tests excluded. The locally built OTP Storybook release served the Hologram playground and passed its application-closure check.

The local toolchain is Elixir 1.20.1 with OTP 29. The Phoenix UI build used the published precompiled Duskmoon toolchain cohort. The native consumer still uses the third-party MDEx NIF. The target GitHub repository returned 404 during remote checks, so GitHub Actions results and registry publication require access to the target.

The automated native-tabs browser fixture timed out on navigation in the focused local rerun. The comparable production LiveView interaction passed in desktop Chrome DevTools. Earlier browser runs exposed stale Core and Chat fixture paths. The corrected Chat fixture regenerated the documented utility classes with the published toolchain. The headless browser suite still needs a final run. Keep the exact GitHub browser gate pending until it runs against the final checkout.

See [the paired production measurements](performance.md) for requests, transfer sizes, paint, control readiness, main-thread work and layout shift.

The existing Storybook lock includes Plug 1.20.3 through an exact `gaoxy_http 0.15.1` requirement. Hex reports EEF-CVE-2026-120287 for that Plug version. Moving Storybook to Plug 1.20.4 requires a compatible Gaoxy cohort upgrade. The independent native Hex consumer resolved Plug 1.20.4.
