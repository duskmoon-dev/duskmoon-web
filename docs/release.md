# Web releases

Every formal Web release publishes the entire public inventory at the version in root [VERSION](../VERSION). That includes the Elements base, aggregates and all individual Elements and Art Elements packages, plus both Phoenix distributions. For an unchanged package, describe the release as version alignment only. An incompatible stable API change bumps the group major. Compatible additions bump the minor and compatible fixes bump the patch.

The first unified release is 11.0.0. Public registry lookups for all 96 distribution identities are recorded in [the source inventory](package-inventory.json). The old npm and Hex Phoenix packages were both at 10.1.4 and had the highest published major, 10. The new `duskmoon_phoenix` public package endpoints returned 404 in both registries. Registry-side naming and the publishing account's permissions must be confirmed during setup. Design, Duskmoon Bundler, and Bundler's Hologram fork have independent release versions.

## Update a release

1. Edit `VERSION` and run `node scripts/release.mjs sync`. Commit the updated public manifests and the generated Phoenix `VERSION` file so Mix reads the same version in and outside the repository.
2. Run `bun install` to update the root lock and `node scripts/release.mjs check`. The checker rejects an omitted public workspace or any same-group dependency that resolves to another version.
3. Record breaking changes, fixes and additions by package. The rest of the packages are version-alignment-only releases. For 11.0.0, record the Phoenix identity, renderer and opt-in changes in the migration guide. Core/CSS Art, Elements and React retain their public identities and receive coordinated version alignment, workspace/packaging fixes and rewritten same-group requirements.

## Verify a release candidate

Dispatch **Web release** on `main` with the full SHA at that ref and the exact version. Leave `publish` disabled to stage and verify. GitHub Actions builds JS and Phoenix from that commit. The Mix steps select the locked published precompiled Bundler toolchain. Validation includes tarball metadata and exports, an isolated React rendering/build check, all npm packages installed together, and a clean native Phoenix consumer using the unpacked Hex package. The workflow exercises an interrupted publish and resume with an in-memory registry. It cannot write to npm or Hex during this simulation.

Run the equivalent artifact checks locally after building with `bun run build:packages` and `(cd phoenix && MIX_ENV=prod scripts/with-precompiled-toolchain.sh mix prepublish)`:

```sh
sha=$(git rev-parse HEAD)
stage=$(mktemp -d)
(cd phoenix/apps/duskmoon_phoenix && MIX_ENV=prod mix hex.build --output "$stage/duskmoon_phoenix.tar")
node scripts/release.mjs stage "$stage/web" "$sha" "$stage/duskmoon_phoenix.tar"
CHROME_BIN=/path/to/chrome node scripts/verify-consumers.mjs "$stage/web"
node scripts/release.mjs dry-run "$stage/web" "$sha"
```

Use `--no-browser` to run the archive and HTTP checks with an existing browser session handled separately. Use `--serve-native` to keep the native consumer running for that session. The stage command requires a clean checkout. The release manifest records the full commit, both lockfile hashes, every archive's byte size and SHA-256, plus the dependency-derived publication order. The four standalone Core/Tailwind downloads are staged and hashed with the registry archives. Keep the workflow run ID with the archived output.

## Publication and recovery

The GitHub `release` environment controls publication. Set up npm scope publishing grants or trusted publishers for the Web workflow, arrange first-publication authorization for the new npm package, and configure the Hex key for the package owner. Make the release credentials available to the `release` environment.

The publication job consumes the verified Actions artifact and submits missing npm archives in dependency order, then the Hex archive. It checks each already-published archive's bytes before continuing. It verifies availability and bytes from both registries after submission, then publishes a GitHub release with its manifest and the four standalone Core/Tailwind downloads. The public release marks the coordinated release complete. Individual registry entries can appear earlier.

If publication stops, rerun the failed job using the same validated artifact. A new dispatch on `main` can use the original `source_sha`, `version`, and `recovery_run_id` to download the original staging output. A different registry hash is a conflict that stops publication. Keep the original archives available for the recovery window. A same-version archive rebuilt later might differ and is unsuitable for resolving a registry hash conflict.
