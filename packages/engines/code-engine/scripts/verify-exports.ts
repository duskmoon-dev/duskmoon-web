#!/usr/bin/env bun
/**
 * Verify all subpath exports in package.json resolve to actual files in dist/.
 */

import { readFile, stat } from "fs/promises";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8"));
  const exports = pkg.exports;

  if (!exports) {
    console.error("No exports field in package.json");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  const entries = Object.entries(exports).flatMap(([exportPath, value]) => {
    const entry = value as { types?: string; import?: string };
    if (!exportPath.includes("*")) return [[exportPath, entry] as const];
    // [DUSKMOON] Compare every wildcard module to its authoritative source file.
    const sourcePattern = entry.import!.replace(/^\.\/dist\//, "src/")
      .replace(/\.js$/, ".{js,ts}");
    const prefix = sourcePattern.slice(0, sourcePattern.indexOf("*"));
    const files = [...new Bun.Glob(sourcePattern).scanSync({ cwd: ROOT })]
      .filter(file => !file.endsWith(".d.ts"));
    if (!files.length) throw new Error("No source modules for " + exportPath);
    return files.map(file => {
      const name = file.slice(prefix.length).replace(/\.(js|ts)$/, "");
      return [exportPath.replace("*", name), {
        import: entry.import?.replace("*", name),
        types: entry.types?.replace("*", name),
      }] as const;
    });
  });

  for (const [exportPath, entry] of entries) {
    const jsPath = entry.import;
    const dtsPath = entry.types;

    if (jsPath) {
      const fullPath = join(ROOT, jsPath);
      if (await fileExists(fullPath)) {
        passed++;
      } else {
        failed++;
        failures.push(`${exportPath} → ${jsPath} (JS missing)`);
      }
    }

    if (dtsPath) {
      const fullPath = join(ROOT, dtsPath);
      if (await fileExists(fullPath)) {
        passed++;
      } else {
        failed++;
        failures.push(`${exportPath} → ${dtsPath} (types missing)`);
      }
    }
  }

  console.log(`\nExport verification: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.error("\nFailed exports:");
    for (const f of failures) {
      console.error(`  ✗ ${f}`);
    }
    process.exit(1);
  }

  // Additional checks
  console.log("\nAdditional checks:");

  // Check no require() in dist
  const { stdout: requireCheck } = Bun.spawnSync(
    ["grep", "-r", "require(", join(ROOT, "dist")],
    { stdout: "pipe" }
  );
  const requireMatches = requireCheck.toString().trim();
  if (requireMatches) {
    console.error("  ✗ Found require() calls in dist/:");
    console.error(requireMatches);
    process.exit(1);
  }
  console.log("  ✓ No require() calls in dist/");

  // Check no @codemirror or @lezer import specifiers in actual imports (exclude source maps and string literals)
  const { stdout: cmCheck } = Bun.spawnSync(
    ["grep", "-r", "-E", "from [\"']@codemirror/|from [\"']@lezer/", "--include=*.js", "--include=*.d.ts", join(ROOT, "dist")],
    { stdout: "pipe" }
  );
  const cmMatches = cmCheck.toString().trim();
  if (cmMatches) {
    console.error("  ✗ Found @codemirror/@lezer imports in dist/:");
    console.error(cmMatches);
    process.exit(1);
  }
  console.log("  ✓ No @codemirror/@lezer import specifiers in dist/");

  console.log("\n✓ All exports verified");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
