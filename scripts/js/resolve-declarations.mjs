import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

// TypeScript's bundler resolver accepts extensionless imports in source. The
// emitted ESM declarations must also resolve under NodeNext in an npm consumer.
const output = resolve("dist");
for (const relative of new Bun.Glob("**/*.d.ts").scanSync({ cwd: output })) {
  const path = join(output, relative);
  const source = readFileSync(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const replacements = [];

  function visit(node) {
    const parent = node.parent;
    if (ts.isStringLiteral(node) && (
      (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) && parent.moduleSpecifier === node ||
      ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent)
    )) {
      const specifier = node.text;
      if (/^\.\.?\//.test(specifier) && !/\.(?:m?js|cjs|json)$/.test(specifier)) {
        const target = resolve(dirname(path), specifier);
        const suffix = existsSync(`${target}.d.ts`) ? ".js"
          : existsSync(join(target, "index.d.ts")) ? "/index.js" : null;
        if (!suffix) throw new Error(`Cannot resolve declaration ${relative}: ${specifier}`);
        replacements.push({ at: node.end - 1, suffix });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(ast);
  if (replacements.length) {
    let rewritten = source;
    for (const { at, suffix } of replacements.reverse()) {
      rewritten = rewritten.slice(0, at) + suffix + rewritten.slice(at);
    }
    writeFileSync(path, rewritten);
  }
}
