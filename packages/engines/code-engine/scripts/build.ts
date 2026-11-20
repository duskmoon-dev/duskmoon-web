#!/usr/bin/env bun
/**
 * Main build script for @duskmoon-dev/code-engine
 *
 * 1. Type check
 * 2. Build with Bun bundler (each subpath export as entry point)
 * 3. Generate .d.ts files
 * 4. Verify exports
 */

import { $ } from "bun";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "path";
import ts from "typescript";

const ROOT = join(import.meta.dir, "..");

// [DUSKMOON] Derive the complete runtime surface, including wildcard modules,
// from the public export map so new entries cannot be omitted from the build.
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const entrypoints = new Set<string>();
for (const entry of Object.values(manifest.exports) as { import: string }[]) {
  const source = entry.import.replace(/^\.\/dist\//, "src/");
  if (source.includes("*")) {
    const pattern = source.replace(/\.js$/, ".{js,ts}");
    for (const file of new Bun.Glob(pattern).scanSync({ cwd: ROOT })) {
      if (!file.endsWith(".d.ts")) entrypoints.add(join(ROOT, file));
    }
  } else {
    const typescript = source.replace(/\.js$/, ".ts");
    entrypoints.add(join(ROOT, existsSync(join(ROOT, typescript)) ? typescript : source));
  }
}

async function main() {
  const start = performance.now();

  // 1. Type check
  console.log("Step 1: Type checking...");
  const tc = Bun.spawnSync(["bunx", "tsc", "--noEmit"], { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
  if (tc.exitCode !== 0) {
    console.error("Type check failed!");
    process.exit(1);
  }
  console.log("  ✓ Type check passed\n");

  // 2. Clean dist
  console.log("Step 2: Cleaning dist/...");
  await $`rm -rf ${join(ROOT, "dist")}`;
  console.log("  ✓ Cleaned\n");

  // 3. Build with Bun
  console.log("Step 3: Building with Bun bundler...");
  const result = await Bun.build({
    entrypoints: [...entrypoints],
    outdir: join(ROOT, "dist"),
    root: join(ROOT, "src"),
    target: "browser",
    splitting: true,
    sourcemap: "external",
    minify: false,
    format: "esm",
  });

  if (!result.success) {
    console.error("Build failed!");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
  console.log(`  ✓ Built ${result.outputs.length} files\n`);

  // 4. Generate .d.ts files
  console.log("Step 4: Generating declaration files...");
  const dts = Bun.spawnSync(
    ["bunx", "tsc", "-p", "tsconfig.build.json"],
    { cwd: ROOT, stdout: "inherit", stderr: "inherit" }
  );
  if (dts.exitCode !== 0) {
    console.error("Declaration generation failed!");
    process.exit(1);
  }
  // TypeScript does not emit declaration inputs such as vendored parser types.
  for (const file of new Bun.Glob("src/**/*.d.ts").scanSync({ cwd: ROOT })) {
    const target = join(ROOT, "dist", file.slice("src/".length));
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(ROOT, file), target);
  }
  // [DUSKMOON] ESM declarations must resolve with NodeNext as well as bundlers.
  for (const file of new Bun.Glob("dist/**/*.d.ts").scanSync({ cwd: ROOT })) {
    const path = join(ROOT, file);
    let content = readFileSync(path, "utf8");
    const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
    const replacements: { start: number; end: number; value: string }[] = [];
    function visit(node: ts.Node) {
      const literal = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        ? node.moduleSpecifier
        : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal : undefined;
      if (literal && ts.isStringLiteral(literal) && literal.text.startsWith(".")) {
        const target = resolve(dirname(path), literal.text);
        const suffix = existsSync(target + ".d.ts") ? ".js"
          : existsSync(join(target, "index.d.ts")) ? "/index.js" : "";
        if (suffix) replacements.push({ start: literal.getStart(source) + 1,
          end: literal.getEnd() - 1, value: literal.text + suffix });
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const { start, end, value } of replacements.reverse()) {
      content = content.slice(0, start) + value + content.slice(end);
    }
    if (replacements.length) await writeFile(path, content);
  }
  console.log("  ✓ Declarations generated\n");

  // 5. Fix duplicate exports (Bun bundler quirk)
  console.log("Step 5: Fixing duplicate exports...");
  const fixExports = Bun.spawnSync(["bun", "run", join(ROOT, "scripts/fix-duplicate-exports.ts")], {
    cwd: ROOT, stdout: "inherit", stderr: "inherit"
  });
  if (fixExports.exitCode !== 0) {
    console.error("Fix duplicate exports failed!");
    process.exit(1);
  }

  // 6. Verify exports
  console.log("Step 6: Verifying exports...");
  const verify = Bun.spawnSync(["bun", "run", join(ROOT, "scripts/verify-exports.ts")], {
    cwd: ROOT, stdout: "inherit", stderr: "inherit"
  });
  if (verify.exitCode !== 0) {
    console.error("Export verification failed!");
    process.exit(1);
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(1);
  console.log(`\n✓ Build complete in ${elapsed}s`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
