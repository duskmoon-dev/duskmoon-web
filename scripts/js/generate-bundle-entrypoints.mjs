import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const prefix = process.argv[2];

if (!prefix) {
  throw new Error(
    'Usage: bun scripts/js/generate-bundle-entrypoints.mjs <dependency-prefix> (from the package directory)',
  );
}

const targetDir = process.cwd();
const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf8'));
const distDir = join(targetDir, 'dist');
const dependencies = Object.keys(pkg.dependencies ?? {})
  .filter((name) => name.startsWith(prefix) && name !== '@duskmoon-dev/el-base')
  .sort();

const entryPrefix = prefix.replace('@duskmoon-dev/', '');
const existingEntries = await readdir(join(distDir, 'esm'), { withFileTypes: true });
const generatedDirs = existingEntries
  .filter((entry) => entry.isDirectory() && entry.name.startsWith(entryPrefix))
  .map((entry) => entry.name);

await Promise.all(
  ['esm', 'cjs', 'types'].flatMap((format) =>
    generatedDirs.map((entry) =>
      rm(join(distDir, format, entry), { recursive: true, force: true }),
    ),
  ),
);

for (const dependency of dependencies) {
  const subpath = dependency.replace('@duskmoon-dev/', '');

  await Promise.all([
    mkdir(join(distDir, 'esm', subpath), { recursive: true }),
    mkdir(join(distDir, 'cjs', subpath), { recursive: true }),
    mkdir(join(distDir, 'types', subpath), { recursive: true }),
  ]);

  await Promise.all([
    writeFile(join(distDir, 'esm', subpath, 'index.js'), `export * from '${dependency}';\n`),
    writeFile(join(distDir, 'esm', subpath, 'register.js'), `import '${dependency}/register';\n`),
    writeFile(
      join(distDir, 'cjs', subpath, 'index.js'),
      `module.exports = require('${dependency}');\n`,
    ),
    writeFile(join(distDir, 'cjs', subpath, 'register.js'), `require('${dependency}/register');\n`),
    writeFile(join(distDir, 'types', subpath, 'index.d.ts'), `export * from '${dependency}';\n`),
    writeFile(
      join(distDir, 'types', subpath, 'register.d.ts'),
      `import '${dependency}/register';\n`,
    ),
  ]);
}
