# Web releases

Every formal Web release publishes the entire public inventory at the version in root [VERSION](../VERSION). This includes the npm TypeScript engine and Elements adapter, both Phoenix distributions, and the `code-engine` and `yew-duskmoon` crates. For an unchanged package, describe the release as version alignment only. An incompatible stable API change bumps the group major. Compatible additions bump the minor and compatible fixes bump the patch.

The unified Web release series starts at `2.0.0` with `2.0.0-rc.0` as its first release candidate. Candidates use `X.Y.Z-rc.N`, the npm `rc` dist-tag, and GitHub's prerelease flag. Test with an exact published version. The inventory covers 99 distributions across 96 npm packages, one Hex package, and two crates. Historical registry observations appear in [the source inventory](package-inventory.json). Design, Duskmoon Bundler, and Bundler's Hologram fork have independent release versions.

## Update a release

1. Edit `VERSION` and run `node scripts/release.mjs sync` with Cargo available. Commit the updated public manifests, generated Phoenix `VERSION` file, and Cargo locks.
2. Run `bun install` to update the root lock and `node scripts/release.mjs check`. The checker rejects an omitted public workspace or any same-group dependency that resolves to another version.
3. Record breaking changes, fixes and additions by package. The rest of the packages are version-alignment-only releases.

## 2.0.0-rc.2

- `@duskmoon-dev/el-tabs` preserves horizontal scrolling and keyboard focus as selection changes.
- `duskmoon_phoenix` adds opt-in automatic chat following when readers scroll back to the bottom.
- GitHub Pages now hosts a project directory with the Web docs, demos, and examples.

## Verify a release candidate

Dispatch **Web release** on `main` with the full SHA at that ref and the exact version. Leave `publish` disabled to stage and verify. The workflow uses the locked precompiled Bundler toolchain for Phoenix and Cargo's temporary workspace registry to package both crates before their release versions exist on crates.io. Isolated npm consumers exercise the TypeScript engine on its own and with its Elements adapter in desktop Chrome. The Yew consumer checks the unpacked crates for native Markdown/Mermaid, Wasm compilation, Core CSS, and syntax resource export. The dry-run simulates interrupted publication and recovery for each registry.

Run the equivalent artifact checks locally after building with `bun run build:packages` and `(cd phoenix && MIX_ENV=prod scripts/with-precompiled-toolchain.sh mix prepublish)`:

```sh
sha=$(git rev-parse HEAD)
stage=$(mktemp -d)
(cd phoenix/apps/duskmoon_phoenix && MIX_ENV=prod mix hex.build --output "$stage/duskmoon_phoenix.tar")
cargo package --manifest-path yew/Cargo.toml --locked --workspace
node scripts/release.mjs stage "$stage/web" "$sha" "$stage/duskmoon_phoenix.tar" yew/target/package
CHROME_BIN=/path/to/chrome node scripts/verify-consumers.mjs "$stage/web"
node scripts/release.mjs dry-run "$stage/web" "$sha"
```

Use `--engine-only` for the two isolated engine consumers or `--yew-only` for the Rust and Core CSS check. Use `--serve-engine` or `--serve-native` to keep the corresponding production fixture running for Chrome DevTools. Use `--no-browser` to run the archive and HTTP checks without launching the browser suites. The stage command requires a clean checkout. The release manifest records the full commit, the Bun, Mix and Cargo lockfile hashes, every archive's byte size and SHA-256, and the publication order. The four standalone Core/Tailwind downloads are staged and hashed with the registry archives. Keep the workflow run ID with the archived output.

## Publication and recovery

The GitHub `release` environment controls publication. Configure an npm trusted
publisher on each npm package, including `@duskmoon-dev/code-engine` and
`duskmoon_phoenix`. Use `duskmoon-dev/duskmoon-web`, workflow `release.yml`, and
environment `release`, with permission for `npm publish`. The workflow uses
OIDC for npm. Set `HEX_API_KEY` and a `CARGO_REGISTRY_TOKEN` authorized to
publish both crates in the release environment.

The npm, Hex, and crates.io jobs publish in parallel from the same verified
Actions artifact. Each job continues if another registry fails. The npm job
publishes in dependency order, including `@duskmoon-dev/code-engine` before
`@duskmoon-dev/el-code-engine`. The crates.io job verifies the `code-engine`
index entry and archive before publishing `yew-duskmoon`. Cargo repackages
from the pinned commit and checks the staged hash before each `cargo publish`.
After all three jobs verify their published archives, a separate job publishes
the GitHub release with a versioned link for every package in the manifest.
Individual registry entries can appear earlier.

If publication stops, rerun the failed job using the same validated artifact. If a registry reports a staged version, review and approve it in the registry before retrying. A new dispatch on `main` can use the original `source_sha`, `version`, and `recovery_run_id` to download the original staging output. A different registry hash is a conflict that stops publication. Keep the original archives available for the recovery window. A same-version archive rebuilt later might differ and is unsuitable for resolving a registry hash conflict.
