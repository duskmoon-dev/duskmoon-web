# Packaged Composer and Phoenix extension proof

Run from the Web repository root with the staged npm archives for one Web release.

```sh
bun scripts/js/check-composer-package.ts \
  --artifact /absolute/stage/duskmoon-dev-components-11.0.0.tgz \
  --core /absolute/stage/duskmoon-dev-core-11.0.0.tgz \
  --phoenix /absolute/stage/duskmoon_phoenix-11.0.0.tgz
```

The checker installs the real tarballs into two temporary applications outside
the repository. Use `--keep` to inspect the directories. The applications run
strict typechecking, plain and rich server rendering, and import graph checks.
The plain variant omits Lexical. The rich variant verifies a deferred editor
chunk and a single Lexical runtime.

Both applications mount the public `createDuskmoonReactChat` factory and supply
a Composer through the Phoenix bridge. The fake LiveView transport exercises
the application-defined `composer_submission` and `composer_receipt` contract.
Timeouts, non-definitive replies and disconnects preserve drafts. This fixture
covers the package extension contract with a fake transport. See [the bridge
guide](../../../../../docs/bridge.md) for the live browser and server contract.
