import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const [file] = process.argv.slice(2);
if (!file) throw new Error("Usage: node scripts/release-notes.mjs RELEASE_MANIFEST");

const { version, artifacts } = JSON.parse(readFileSync(file, "utf8"));
assert.match(version, /^\d+\.\d+\.\d+(?:-rc\.\d+)?$/);
assert(artifacts.length > 0, "No published packages in the manifest");

const registries = {
  npm: (name) => `https://www.npmjs.com/package/${name}/v/${version}`,
  Hex: (name) => `https://hex.pm/packages/${encodeURIComponent(name)}/${version}`,
  "crates.io": (name) => `https://crates.io/crates/${encodeURIComponent(name)}/${version}`,
};

const groups = { npm: [], Hex: [], "crates.io": [] };
for (const artifact of artifacts) {
  const registry = artifact.registry === "hex" ? "Hex" : artifact.registry;
  assert(Object.hasOwn(groups, registry), `Unknown registry ${registry}`);
  assert.match(artifact.name, /^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/);
  assert.equal(artifact.version, version, artifact.name);
  groups[registry].push(artifact.name);
}

const notes = ["## Published packages"];
for (const [registry, names] of Object.entries(groups)) {
  if (!names.length) continue;
  notes.push("", `### ${registry} (${names.length})`, "", "| Package | Version |", "| --- | --- |");
  for (const name of names.sort()) {
    notes.push(`| [\`${name}\`](${registries[registry](name)}) | \`${version}\` |`);
  }
}
console.log(notes.join("\n"));
