import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertNoElementReference } from "./react-imports.mjs";

const root = join(import.meta.dirname, "../..");
const rootManifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const packages = rootManifest.workspaces.filter((path) => path.startsWith("packages/react/"));
const runtimeGroups = ["dependencies", "optionalDependencies", "peerDependencies"];
const visited = new Set();

function installedManifest(name, path) {
  for (let dir = dirname(path); dir.startsWith(root); dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", name, "package.json");
    if (existsSync(candidate)) return candidate;
  }
}

function inspectClosure(manifestPath, includeDev) {
  const path = realpathSync(manifestPath);
  if (visited.has(path)) return;
  visited.add(path);
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  assertNoElementReference(pkg.name, path);
  for (const group of includeDev ? [...runtimeGroups, "devDependencies"] : runtimeGroups) {
    for (const name of Object.keys(pkg[group] ?? {})) {
      assertNoElementReference(name, path);
      const dependency = installedManifest(name, path);
      if (!dependency && (group === "optionalDependencies" || pkg.peerDependenciesMeta?.[name]?.optional)) continue;
      if (!dependency) throw new Error(`Missing ${group} entry ${name} required by ${pkg.name}`);
      inspectClosure(dependency, false);
    }
  }
}

function scanPackage(dir) {
  const nativeTag = /(?:["'`<])el-dm-[a-z]|\bcustomElements\s*\.\s*define\b/;
  let fileCount = 0;
  for (const pattern of ["src/**/*.{ts,tsx,js,css}", "scripts/**/*.{ts,mjs}", "build.ts", "dist/**/*.{js,ts,css}"]) {
    const files = new Bun.Glob(pattern).scanSync({ cwd: dir });
    for (const file of files) {
      const path = join(dir, file);
      const content = readFileSync(path, "utf8");
      assertNoElementReference(content, path);
      if (nativeTag.test(content)) throw new Error(`Custom element registration or tag in ${path}`);
      fileCount++;
    }
  }
  if (!existsSync(join(dir, "dist/index.js"))) throw new Error(`Build React package before scanning ${dir}`);
  return fileCount;
}

let files = 0;
for (const packagePath of packages) {
  const dir = join(root, packagePath);
  inspectClosure(join(dir, "package.json"), true);
  files += scanPackage(dir);
}
console.log(`React remains independent of Elements across ${visited.size} installed dependency manifests and ${files} source/build/output files`);
