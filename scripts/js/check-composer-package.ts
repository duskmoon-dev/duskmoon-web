/** Run only against completed package artifacts; all install/output writes use a fresh temp directory. */
import {
  cp,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const artifact = option("--artifact");
const phoenix = option("--phoenix");
const core = option("--core");
if (!artifact?.endsWith(".tgz") || !phoenix?.endsWith(".tgz") || !core?.endsWith(".tgz"))
  throw new Error(
    "Usage: bun scripts/js/check-composer-package.ts --artifact /abs/components.tgz --core /abs/core.tgz --phoenix /abs/duskmoon_phoenix.tgz [--temp /existing/temp-parent] [--keep]",
  );
const repo = resolve(import.meta.dir, "../..");
const tempParent = await realpath(option("--temp") ?? tmpdir());
const within = relative(repo, tempParent);
if (!isAbsolute(within) && !within.startsWith(".."))
  throw new Error(
    "Use a temp directory outside the repository to prove dependency isolation",
  );
const work = await mkdtemp(join(tempParent, "composer-consumer-"));
async function run(command: string[], cwd: string) {
  console.log(`RUN ${command.join(" ")} (${cwd})`);
  const child = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await child.exited) !== 0)
    throw new Error(`Command failed: ${command.join(" ")}`);
}
try {
  const source = await realpath(artifact);
  const coreArchive = await realpath(core);
  const phoenixArchive = await realpath(phoenix);
  const template = join(repo, "packages/react/test/fixtures/composer-consumer");
  for (const mode of ["plain", "rich"]) {
    const directory = join(work, mode);
    await cp(template, directory, { recursive: true });
    const packagePath = join(directory, "package.json");
    const manifest = JSON.parse(await readFile(packagePath, "utf8"));
    Object.assign(manifest.dependencies, {
      "@duskmoon-dev/components": `file:${source}`,
      "@duskmoon-dev/core": `file:${coreArchive}`,
      duskmoon_phoenix: `file:${phoenixArchive}`,
    });
    if (mode === "rich")
      Object.assign(manifest.dependencies, {
        lexical: "0.53.0",
        "@lexical/history": "0.53.0",
        "@lexical/plain-text": "0.53.0",
      });
    await writeFile(packagePath, JSON.stringify(manifest, null, 2) + "\n");
    await run(
      [
        "npm",
        "install",
        "--ignore-scripts",
        "--omit=optional",
        "--no-audit",
        "--no-fund",
      ],
      directory,
    );
    const installedPhoenix = join(directory, "node_modules/duskmoon_phoenix");
    const phoenixManifest = JSON.parse(
      await readFile(join(installedPhoenix, "package.json"), "utf8"),
    );
    if (
      phoenixManifest.name !== "duskmoon_phoenix" ||
      phoenixManifest.exports?.["./react-chat"] !== "./assets/js/react_chat/index.js"
    ) throw new Error("Unsupported Phoenix public React Chat entry");
    await run(
      ["bun", "x", "--no-install", "tsc", "--project", "tsconfig.json"],
      directory,
    );
    await run(["bun", "run", "graph.ts", mode], directory);
    await run(["bun", "run", "ssr.tsx"], directory);
    if (mode === "rich") await run(["bun", "run", "rich-ssr.tsx"], directory);
    await run(
      ["bun", "test", "--preload", "./setup.ts", "./phoenix.test.tsx"],
      directory,
    );
  }
  console.log(
    `PASS packaged Composer consumer (${basename(source)}), ${basename(phoenixArchive)}`,
  );
} finally {
  if (args.includes("--keep")) console.log(`KEPT ${work}`);
  else await rm(work, { recursive: true, force: true });
}
