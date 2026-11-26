# Duskmoon Visualization Contract snapshot

Version `1.0.0-draft.1` is the P0 candidate. The capability matrix uses P1–P4 for target stages. Required capabilities shared by all charts use the component's later target stage where applicable. A platform's capabilities stay unverified until exercised against the same snapshot.

## Verify and import

Run this from the Web repository or the Flutter snapshot root using Node.js 18 or newer. The verifier uses only Node built-ins and works offline.

```sh
node specs/visualization/v1/verify.mjs
```

1. After candidate review, select the exact Web commit containing this directory. Record the Web Git URL and its full commit SHA. Copy the directory from that commit into Flutter with `git archive <source-commit> specs/visualization/v1` and extract it at the Flutter root. For updates, replace the previous snapshot so removed files cannot survive the import.
2. Store the consumer lock outside the hashed directory at `specs/visualization/v1.lock.json`. Set `version` and `source` to the values from `manifest.json`, `sourceCommit` to the selected full commit SHA, and `manifestSha256` to the digest printed by the verified Web snapshot. Obtain the expected digest from the selected source commit.
3. Run `node specs/visualization/v1/verify.mjs specs/visualization/v1.lock.json` on Flutter before adopting the snapshot. The verifier compares each file with the manifest, checks fixture/expected pairing and compares the manifest digest to the lock. It does not fetch or authenticate a commit. Review the source commit before recording the lock.

Pass fixture chart payloads and expected events through the corresponding JSON Schema and use the semantic rules in `contract.md` for additional validation and behavior. Fixtures and expected outcomes are language-neutral acceptance inputs. Runtime compatibility and rendering are verified when their platform adapters are implemented.

## P0 compatibility review

Web source inspected at `d123064d1f5f8d69129f5987c901665aa4217627` matches the plan baseline. React has no chart export and Elements bar, line and pie use the first dataset. The contract is for the new React and Flutter entry points.

Flutter public declarations and implementation defaults were inspected at `c0e94fb37d2d59fe3d82a5aecc5a235a386ae4ec`. At final verification, Flutter was at `08e8959cfa74a9f9782046d7f144be3346d23a16`. The visualization package diff since inspection contains only the version and changelog update, and there is no package diff from the plan baseline to the final HEAD.

| Flutter surface | Compatibility expectation for the new entry point |
| --- | --- |
| `DmVizPoint` and XY const constructors | Keep `y` as `double` and keep existing constructors. Add series/datum models for nullable data and explicit IDs. Use reserved adapter series IDs such as `legacy:primary` and `legacy:comparison` on the old entry point. Stable datum identity across edits is available to callers of the new entry point. |
| Line `data + comparisonData` | Preserve smoothing, shown markers, numeric y including zero, 10% nonzero constant padding, primary/secondary colors and dashed comparison line in the legacy path. |
| Bar, Scatter and Heatmap | Preserve Bar's corner radius, Scatter's callback-based radius and marker enum, and Heatmap's indexed coordinates, value labels and Viridis behavior in the legacy paths. |
| `DmChartPalette` | Keep the existing const constructor and required fields. Resolve new theme roles with an adapter and optional overrides. |
| Network | Keep `links`, nullable positions, optional simulation and existing callbacks. New fixed layout uses explicit coordinates and edge IDs. |
| Map | Keep caller-provided projection and feature-tap API. The shared entry point uses Mercator and rejects geometry outside its defined range. |
| Compat imports | Retain the curated main exports, raw compat entry point and legacy smoke/compile tests. |

Feedback on a draft changes the Web authority first. Flutter imports the resulting immutable version and validates the lock before implementing the shared behavior.
