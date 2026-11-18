import { build } from "bun";
import { assertNativeReactBuild } from "../../../scripts/js/react-imports.mjs";

const result = await build({
  entrypoints: ["src/index.tsx"],
  outdir: "dist",
  root: "./src",
  target: "browser",
  format: "esm",
  external: ["react", "react/*", "react-dom", "react-dom/*", "@duskmoon-dev/css-art"],
  minify: false,
  metafile: true,
  naming: "[dir]/[name].[ext]",
  banner: '"use client";\n',
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

if (!result.success) {
  console.error("Art components build failed");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

assertNativeReactBuild(result);
console.log("Art components build successful");
