import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const [version] = process.argv.slice(2);
assert(version, "Usage: node code-engine-exports.mjs EXPECTED_VERSION");
const cwd = dirname(fileURLToPath(import.meta.url));
const installed = join(realpathSync(cwd), "node_modules/@duskmoon-dev/code-engine");
assert(lstatSync(installed).isDirectory(), "The engine must be extracted from its tarball");
const packageDir = realpathSync(installed);
assert.equal(packageDir, installed, "The engine must have no workspace symlink");
const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
const expected = JSON.parse(readFileSync(join(cwd, "code-engine-expected-exports.json"), "utf8"));
assert.equal(pkg.version, version);
assert.equal(pkg.name, "@duskmoon-dev/code-engine");
assert.equal(pkg.license, "MIT");
assert.deepEqual(pkg.exports, expected.exports, "Packed exports differ from the authoritative source manifest");
for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
  assert.deepEqual(Object.keys(pkg[field] ?? {}), [], "Engine runtime dependencies must be empty");
}
const license = readFileSync(join(packageDir, "LICENSE"), "utf8");
assert.match(license, /MIT License/);
assert.match(license, /Marijn Haverbeke/);
assert.match(license, /DuskMoon Dev/);
assert.match(readFileSync(join(packageDir, "UPSTREAM.md"), "utf8"), /codemirror\/state/);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    assert(!entry.isSymbolicLink(), "Packed engine has a symlink " + path);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(join(packageDir, "dist"));
const publicModules = [];
for (const [subpath, targets] of Object.entries(pkg.exports)) {
  const names = subpath.includes("*") ? expected.legacyModules : [null];
  if (subpath.includes("*")) {
    assert.equal(subpath, "./lang/legacy/*", "Supply concrete source modules for a new wildcard");
    assert(names.length > 1, "Missing authoritative legacy source module list");
    const shipped = files.filter((file) => relative(join(packageDir, "dist/lang/legacy"), file)
      .match(/^[^/]+\.js$/)).map((file) => file.slice(file.lastIndexOf("/") + 1, -3)).sort();
    assert.deepEqual(shipped, [...names].sort(), "Packed wildcard modules differ from the complete source list");
  }
  for (const name of names) {
    const concrete = name === null ? subpath : subpath.replace("*", name);
    assert(targets.import && targets.types, "Each public export needs runtime and types " + concrete);
    for (const target of Object.values(targets)) {
      assert.equal(typeof target, "string", "Unexpected export condition");
      const path = resolve(packageDir, name === null ? target : target.replace("*", name));
      assert(path.startsWith(packageDir + "/"), "Export escapes its package");
      assert(lstatSync(path).isFile(), "Missing packed export " + path);
    }
    const specifier = pkg.name + (concrete === "." ? "" : concrete.slice(1));
    const module = await import(specifier);
    assert(Object.keys(module).length, "Empty runtime export " + specifier);
    publicModules.push(specifier);
  }
}

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: false,
  types: [],
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
};
let references = 0;
for (const file of files.filter((path) => /(?:\.js|\.d\.ts)$/.test(path))) {
  const declaration = file.endsWith(".d.ts");
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true,
    declaration ? ts.ScriptKind.TS : ts.ScriptKind.JS);
  const specifiers = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      specifiers.push(node.argument.literal.text);
    } else if (ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
       (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
      assert.notEqual(node.expression.text, "require", "CommonJS runtime in " + file);
      assert(node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0]),
        "Unverifiable dynamic import in " + file);
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(source.typeReferenceDirectives.length, 0, "External declaration types in " + file);
  for (const reference of source.referencedFiles) specifiers.push(reference.fileName);
  for (const specifier of specifiers) {
    references++;
    assert(typeof specifier === "string" && specifier.startsWith("."),
      "External runtime or declaration import " + specifier + " in " + file);
    const target = declaration
      ? ts.resolveModuleName(specifier, file, compilerOptions, ts.sys).resolvedModule?.resolvedFileName
      : resolve(dirname(file), specifier);
    assert(target && existsSync(target), "Missing shared chunk or declaration " + specifier + " in " + file);
    const path = relative(packageDir, realpathSync(target));
    assert(!path.startsWith("..") && !isAbsolute(path), "Import escapes packed engine " + specifier);
  }
}

const coverage = publicModules.map((specifier, index) =>
  'import * as public' + index + ' from ' + JSON.stringify(specifier) + ';\nvoid public' + index + ';').join("\n");
const typeFile = join(cwd, "code-engine-all-types.ts");
writeFileSync(typeFile, coverage + `
import { EditorState, EditorView, type Extension } from "@duskmoon-dev/code-engine";
import { javascript } from "@duskmoon-dev/code-engine/lang/javascript";
import { elixir } from "@duskmoon-dev/code-engine/lang/elixir";
import { basicSetup } from "@duskmoon-dev/code-engine/setup";
import { duskMoon } from "@duskmoon-dev/code-engine/theme/duskmoon";
const extensions: Extension[] = [basicSetup, javascript(), elixir(), duskMoon()];
const state: EditorState = EditorState.create({extensions});
const view: EditorView = new EditorView({state, parent: document.body});
view.destroy();
`);
for (const options of [compilerOptions, { ...compilerOptions,
  module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext }]) {
  const program = ts.createProgram([typeFile], options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => cwd,
    getNewLine: () => "\n",
  }));
}

const engine = await import(pkg.name);
const state = await import(pkg.name + "/state");
const view = await import(pkg.name + "/view");
const language = await import(pkg.name + "/language");
const commands = await import(pkg.name + "/commands");
const parser = await import(pkg.name + "/parser/common");
assert.equal(engine.EditorState, state.EditorState);
assert.equal(engine.EditorView, view.EditorView);
assert.equal(engine.LanguageSupport, language.LanguageSupport);
assert.equal(engine.Tree, parser.Tree);
const javascript = await import(pkg.name + "/lang/javascript");
const elixir = await import(pkg.name + "/lang/elixir");
const { basicSetup } = await import(pkg.name + "/setup");
const { duskMoon } = await import(pkg.name + "/theme/duskmoon");
const compartment = new state.Compartment();
let documentState = state.EditorState.create({
  doc: "const answer = 42",
  extensions: [basicSetup, compartment.of(javascript.javascript()), duskMoon()],
});
assert.equal(language.syntaxTree(documentState).topNode.name, "Script");
documentState = documentState.update({
  effects: compartment.reconfigure(elixir.elixir()),
  changes: { from: 0, to: documentState.doc.length, insert: "defmodule Example do\nend" },
}).state;
assert.notEqual(language.syntaxTree(documentState).topNode.name, "Script");
assert.equal(typeof commands.undo, "function");
assert.equal(engine.EditorState, documentState.constructor);
console.log(`Engine tarball verified ${publicModules.length} concrete public modules, ${files.length} files and ${references} internal references, all declarations and shared extension identities at ${version}`);
