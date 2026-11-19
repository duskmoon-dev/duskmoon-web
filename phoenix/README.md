# Duskmoon Phoenix workspace

The bounded Mix workspace contains the publicly distributed
[`duskmoon_phoenix`](apps/duskmoon_phoenix), plus the private
[`duskmoon_storybook`](apps/duskmoon_storybook) demonstration application.
See the package [installation guide](apps/duskmoon_phoenix/guides/getting-started.md)
and [migration guide](apps/duskmoon_phoenix/guides/migrating-to-duskmoon-web.md).

Install and build workspace dependencies from the Web repository root.

```sh
bun install --frozen-lockfile
bun run build:packages
cd phoenix
mix deps.get --check-locked
elixir scripts/check-toolchain.exs
```

Run the tests and build the Storybook with the published, precompiled Duskmoon
toolchain. Use Elixir 1.18+ and OTP 28+ and a supported native target from the
Bundler release. The 10.1.3 cohort remains pinned by `mix.lock`.

```sh
MIX_ENV=test scripts/with-precompiled-toolchain.sh mix test
MIX_ENV=prod scripts/with-precompiled-toolchain.sh mix storybook.assets
```

See [the Hologram examples](docs/hologram-example.md) for the shared example
shell and compiler/runtime requirements. See [Web releases](../docs/release.md)
for coordinated npm and Hex staging.
