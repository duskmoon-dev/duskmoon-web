# Web releases

Every formal Web release publishes the entire public inventory at the version in root [VERSION](../VERSION). This includes every Elements package, both Phoenix distributions, and the `code-engine` and `yew-duskmoon` crates. For an unchanged package, describe the release as version alignment only. An incompatible stable API change bumps the group major. Compatible additions bump the minor and compatible fixes bump the patch.

The unified Web release series starts at `2.0.0` with `2.0.0-rc.0` as its first release candidate. Candidates use `X.Y.Z-rc.N`, the npm `rc` dist-tag, and GitHub's prerelease flag. Test with an exact version, for example `bun add @duskmoon-dev/core@2.0.0-rc.0`. Registry history for all 98 distribution identities is recorded in [the source inventory](package-inventory.json). Design, Duskmoon Bundler, and Bundler's Hologram fork have independent release versions.

## Update a release

1. Edit `VERSION` and run `node scripts/release.mjs sync` with Cargo available. Commit the updated public manifests, generated Phoenix `VERSION` file, and Cargo locks.
2. Run `bun install` to update the root lock and `node scripts/release.mjs check`. The checker rejects an omitted public workspace or any same-group dependency that resolves to another version.
3. Record breaking changes, fixes and additions by package. The rest of the packages are version-alignment-only releases. The Web 2.0 candidate includes the Phoenix package rename, native renderers, and explicit React and Elements integrations. Core, CSS Art, Elements, React, and Yew retain their public identities and move to coordinated versions.

## Verify a release candidate

Dispatch **Web release** on `main` with the full SHA at that ref and the exact version. Leave `publish` disabled to stage and verify. The workflow uses the locked precompiled Bundler toolchain for Phoenix and Cargo's temporary workspace registry to package both crates before their release versions exist on crates.io. The isolated Yew consumer installs the staged Core tarball and checks the unpacked crates for native Markdown/Mermaid, Wasm compilation, CSS utility generation, and syntax resource export. The dry-run simulates registry writes and resumes after interruptions in the npm group and between the two crates.

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

Use `--no-browser` to run the archive and HTTP checks with an existing browser session handled separately. Use `--yew-only` for the isolated Rust and Core CSS check. Use `--serve-native` to keep the native consumer running for its browser session. The stage command requires a clean checkout. The release manifest records the full commit, the Bun, Mix and Cargo lockfile hashes, every archive's byte size and SHA-256, and the publication order. The four standalone Core/Tailwind downloads are staged and hashed with the registry archives. Keep the workflow run ID with the archived output.

## Publication and recovery

The GitHub `release` environment controls publication. Set up the npm publishing grants or trusted publishers, the Hex key, and a `CARGO_REGISTRY_TOKEN` authorized to publish both crates.

The publication job consumes the verified Actions artifact, publishes missing npm archives in dependency order, then publishes the Hex archive and `code-engine`. Before publishing `yew-duskmoon`, it waits for the `code-engine` index entry and verifies the registry archive against the staged hash. Cargo repackages from the pinned commit, and the workflow compares the candidate archive to the staged bytes before invoking `cargo publish`. The GitHub release is completed after downloads from all three registries match the release manifest. Individual registry entries can appear earlier.

If publication stops, rerun the failed job using the same validated artifact. A new dispatch on `main` can use the original `source_sha`, `version`, and `recovery_run_id` to download the original staging output. A different registry hash is a conflict that stops publication. Keep the original archives available for the recovery window. A same-version archive rebuilt later might differ and is unsuitable for resolving a registry hash conflict.
