import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "../..");
const readManifest = (path) => JSON.parse(readFileSync(path, "utf8"));
const groups = ["dependencies", "optionalDependencies", "peerDependencies", "devDependencies"];
const workspace = new Map();

for (const pattern of readManifest(join(root, "package.json")).workspaces) {
  for (const file of new Bun.Glob(`${pattern}/package.json`).scanSync({ cwd: root })) {
    const dir = dirname(file);
    const manifest = readManifest(join(root, file));
    if (workspace.has(manifest.name)) throw new Error(`Duplicate workspace ${manifest.name}`);
    workspace.set(manifest.name, { dir, ...manifest });
  }
}

const localDependencies = (pkg) => Object.keys(Object.assign({}, ...groups.map((group) => pkg[group])))
  .filter((name) => workspace.has(name));
const publicPackages = new Set([...workspace.values()]
  .filter(({ dir, private: isPrivate }) => dir.startsWith("packages/") && !isPrivate)
  .map(({ name }) => name));

function addDependents(changed) {
  let oldSize;
  do {
    oldSize = changed.size;
    for (const [name, pkg] of workspace) {
      if (localDependencies(pkg).some((dependency) => changed.has(dependency))) changed.add(name);
    }
  } while (oldSize !== changed.size);
}

function addPrerequisites(names) {
  for (const name of names) {
    for (const dependency of localDependencies(workspace.get(name))) names.add(dependency);
  }
}

function dependsOnPhoenix(path) {
  return /^(phoenix\/|packages\/phoenix\/|apps\/(duskmoon_)?storybook\/)/.test(path);
}

function affected(paths) {
  const shared = !paths || paths.some((path) =>
    /^(package\.json$|bun\.lock$|bunfig\.toml$|VERSION$|\.gitattributes$|devenv\.[^/]+$|scripts\/|\.github\/workflows\/)/.test(path));
  const changed = new Set(shared ? workspace.keys() : []);
  for (const path of paths ?? []) {
    const owner = [...workspace.values()].find(({ dir }) => path.startsWith(`${dir}/`));
    if (owner) {
      changed.add(owner.name);
    } else if (path.startsWith("packages/")) {
      const family = path.split("/").slice(0, 2).join("/");
      for (const pkg of workspace.values()) {
        if (pkg.dir.startsWith(`${family}/`)) changed.add(pkg.name);
      }
    }
  }
  addDependents(changed);
  const js = [...changed].filter((name) => publicPackages.has(name) || workspace.get(name).dir.startsWith("apps/"));
  return {
    js,
    phoenix: shared || (paths ?? []).some(dependsOnPhoenix) ||
      js.some((name) => publicPackages.has(name)),
  };
}

async function packageScript(name, script) {
  const pkg = workspace.get(name);
  console.log(`RUN ${name} ${script}`);
  const child = Bun.spawn(["bun", "run", script], {
    cwd: join(root, pkg.dir),
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  if ((await child.exited) !== 0) throw new Error(`${name} ${script} failed`);
}

async function runGraph(names, script) {
  const pending = new Set();
  for (const name of names) {
    const pkg = workspace.get(name);
    if (!pkg.scripts?.[script]) continue;
    if (script === "test") {
      const pattern = new Bun.Glob("{src,test,tests}/**/*{.test,.spec,_test,_spec}.{ts,tsx,js,jsx}");
      if (pattern.scanSync({ cwd: join(root, pkg.dir) }).next().done) {
        console.log(`SKIP ${name}: no source test files`);
        continue;
      }
    }
    pending.add(name);
  }
  while (pending.size) {
    const ready = [...pending].filter((name) =>
      localDependencies(workspace.get(name)).every((dependency) => !pending.has(dependency)));
    if (!ready.length) throw new Error(`Workspace cycle: ${[...pending].join(", ")}`);
    for (let offset = 0; offset < ready.length; offset += 6) {
      const results = await Promise.allSettled(
        ready.slice(offset, offset + 6).map((name) => packageScript(name, script)),
      );
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length) throw new AggregateError(failures.map((result) => result.reason), `${script} failed`);
    }
    for (const name of ready) pending.delete(name);
  }
}

const [command, ...args] = process.argv.slice(2).filter((argument) => argument !== "--");
if (command === "build" || command === "build-apps") {
  const targets = new Set(args.length ? args : command === "build" ? publicPackages :
    [...workspace.values()]
      .filter(({ dir }) => dir.startsWith("apps/") && !dependsOnPhoenix(dir + "/"))
      .map(({ name }) => name));
  for (const name of targets) if (!workspace.has(name)) throw new Error(`Unknown workspace ${name}`);
  addPrerequisites(targets);
  await runGraph(targets, "build");
} else if (command === "test") {
  const targets = args.length ? args : publicPackages;
  for (const name of targets) if (!publicPackages.has(name)) throw new Error(`Unknown public JS package ${name}`);
  await runGraph(targets, "test");
} else if (command === "plan" || command === "check") {
  const [base] = args;
  let paths;
  if (base) {
    const result = Bun.spawnSync(["git", "diff", "--name-only", "--no-renames", "-z", base, "HEAD", "--"], { cwd: root });
    if (result.exitCode !== 0) throw new Error(result.stderr.toString());
    paths = result.stdout.toString().split("\0").filter(Boolean);
  }
  const plan = affected(paths);
  if (command === "plan") {
    console.log(JSON.stringify(plan));
  } else {
    const tests = new Set(plan.js.filter((name) => publicPackages.has(name)));
    const apps = plan.js.filter((name) => workspace.get(name).dir.startsWith("apps/") &&
      !dependsOnPhoenix(workspace.get(name).dir + "/"));
    const targets = new Set([...tests, ...apps]);
    addPrerequisites(targets);
    await runGraph(targets, "build");
    await runGraph(tests, "test");
    if ([...tests].some((name) => workspace.get(name).dir.startsWith("packages/react/"))) {
      const result = Bun.spawnSync(["bun", "scripts/js/react-boundary.mjs"], { cwd: root, stdout: "inherit", stderr: "inherit" });
      if (result.exitCode !== 0) throw new Error("React boundary check failed");
    }
  }
} else {
  throw new Error("Usage: bun scripts/js/workspace.mjs build|build-apps|test [package ...] or plan|check [git base]");
}
