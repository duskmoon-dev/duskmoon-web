import { build } from "bun";
import { assertNativeReactBuild } from "../../../scripts/js/react-imports.mjs";

const result = await build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "browser",
  format: "esm",
  external: [
    "react",
    "react/*",
    "react-dom",
    "react-dom/*",
    "@duskmoon-dev/visualization-core",
  ],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  metafile: true,
  banner: '"use client";',
});
assertNativeReactBuild(result);
