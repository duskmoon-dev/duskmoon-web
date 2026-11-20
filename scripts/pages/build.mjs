import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const [destination] = process.argv.slice(2);
if (!destination) throw new Error("Usage: bun scripts/pages/build.mjs OUTPUT_DIR");

const output = resolve(destination);
const origin = process.env.PAGES_ORIGIN ?? "https://duskmoon-dev.github.io";
const base = (process.env.PAGES_BASE_PATH ?? "/duskmoon-web").replace(/\/$/, "");

const groups = {
  Documentation: [
    { path: "core", app: "css-docs", name: "Duskmoon Core", description: "Theme tokens, CSS components, and CSS Art." },
    { path: "elements", app: "elements-docs", name: "Duskmoon Elements", description: "Custom elements and interactive examples." },
    { path: "react", app: "react-docs", name: "Duskmoon React", description: "Native React components and CSS Art." },
  ],
  Playgrounds: [
    { path: "code-engine", app: "code-engine-playground", name: "Code Engine", description: "Try the editor and syntax highlighting in the browser." },
    { path: "elements-playground", app: "elements-playground", name: "Elements Playground", description: "Try individual custom elements in isolation." },
    { path: "css-demo", app: "css-demo", name: "Tailwind Demo", description: "Explore Core components and themes in plain HTML." },
    { path: "yew", name: "Yew Demo", description: "Browse the Rust and WebAssembly components." },
  ],
  Examples: [
    { path: "astro-starter", app: "astro-starter", name: "Astro Starter", description: "A minimal Astro project using Duskmoon Core." },
    { path: "nextjs-starter", app: "nextjs-starter", name: "Next.js Starter", description: "A Next.js app using Core and Tailwind CSS.", dist: "out" },
    { path: "react-nextjs", app: "react-nextjs-smoke", name: "React in Next.js", description: "Try the React chat composer in a Next.js app.", dist: "out" },
  ],
};

async function run(args, cwd, env = {}) {
  const child = Bun.spawn(args, {
    cwd,
    env: { ...process.env, ...env },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (await child.exited !== 0) throw new Error(`${args.join(" ")} failed in ${cwd}`);
}

async function buildSite(site) {
  const target = join(output, site.path);
  const publicPath = `${base}/${site.path}/`;
  if (site.path === "yew") {
    const cwd = join(root, "yew/example");
    await run(["trunk", "build", "--release", "--locked", "--public-url", publicPath], cwd, {
      DUSKMOON_YEW_HASH_ROUTER: "1",
      NO_COLOR: "true",
    });
    cpSync(join(cwd, "dist"), target, { recursive: true });
  } else {
    const cwd = join(root, "apps", site.app);
    await run(["bun", "run", "build"], cwd, { DOCS_SITE: origin, DOCS_BASE: publicPath });
    if (site.path === "css-demo") {
      mkdirSync(join(target, "dist"), { recursive: true });
      for (const file of ["index.html", "standalone.html", "dist/output.css"]) {
        copyFileSync(join(cwd, file), join(target, file));
      }
    } else {
      cpSync(join(cwd, site.dist ?? "dist"), target, { recursive: true });
    }
  }
  if (!existsSync(join(target, "index.html"))) throw new Error(`Missing entry point for ${site.name}`);
  console.log(`Built ${site.name} at ${publicPath}`);
}

mkdirSync(output);
await run(["bun", "run", "build:packages"], root);
const sites = Object.values(groups).flat();
for (const site of sites) await buildSite(site);

const links = Object.entries(groups).map(([group, entries]) => `
    <section>
      <h2>${group}</h2>
      <ul>${entries.map(({ path, name, description }) => `
        <li><a href="./${path}/"><strong>${name}</strong><span>${description}</span></a></li>`).join("")}
      </ul>
    </section>`).join("\n");
const template = readFileSync(join(import.meta.dirname, "index.html"), "utf8");
writeFileSync(join(output, "index.html"), template.replace("<!-- sites -->", links));

const sitemaps = sites
  .filter(({ path }) => existsSync(join(output, path, "sitemap-index.xml")))
  .map(({ path }) => `Sitemap: ${new URL(`${base}/${path}/sitemap-index.xml`, origin)}\n`);
writeFileSync(join(output, "robots.txt"), `User-agent: *\nAllow: /\n${sitemaps.join("")}`);
