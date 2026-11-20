---
name: duskmoon-web-release
description: Prepare, verify, publish, or recover a coordinated Duskmoon Web release across npm, Hex, crates.io, and GitHub using the committed version and immutable staged artifacts.
---

# Duskmoon Web release

Use the repository's [release runbook](../../../docs/release.md), [package inventory](../../../docs/package-inventory.json), and [workflow](../../../.github/workflows/release.yml). Carry out commits, pushes, publication, and deployment only when they are part of the authorized request.

## Prepare and verify

1. Inspect `VERSION`, repository status, remote `main`, the public release tags, and existing runs before choosing a version or dispatching. Adopt an equivalent run already in progress.
2. For a version bump, edit `VERSION`, run `node scripts/release.mjs sync`, run `bun install`, and run `node scripts/release.mjs check`. Use the runbook for current package and lockfile coverage. Record behavior changes and additions in the release notes.
3. For remote staging, give **Web release** the full source SHA on `main` and the exact committed version. Leave `publish` off for staging-only checks. Reuse the same staging artifact for an approved publication.

## Publish and recover

- With publication authorized, set `publish=true`. Supply `recovery_run_id` for a completed staging run at the exact source SHA and version when reusing its verified output. Keep the snapshot fixed when retrying a registry job.
- Check the npm, Hex, and crates.io jobs individually. If the registry stages publication for owner approval, check its public visibility after approval. A checksum conflict needs investigation against the original staged bytes.
- Inspect the published GitHub tag, attached `release.json`, and registry metadata and archive hashes before reporting success. Release candidates use the npm `rc` dist-tag and a GitHub prerelease. Treat automatic Pages deployment as a separate observable result.
