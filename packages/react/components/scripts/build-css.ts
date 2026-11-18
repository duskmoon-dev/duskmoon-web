import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const coreCssPath = new URL(import.meta.resolve("@duskmoon-dev/core"));
const localCssPath = path.resolve(packageRoot, "src", "styles.css");
const outputPath = path.resolve(packageRoot, "dist", "styles.css");

const [coreCss, localCss] = await Promise.all([
  readFile(coreCssPath, "utf8"),
  readFile(localCssPath, "utf8"),
]);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${coreCss.trimEnd()}\n\n${localCss.trimEnd()}\n`);
