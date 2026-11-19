import { join } from "node:path";

const stagingDir = process.env.TRUNK_STAGING_DIR;
if (!stagingDir) {
  throw new Error("TRUNK_STAGING_DIR is required; run this script through Trunk.");
}

const index = Bun.file(join(stagingDir, "index.html"));
const html = await index.text();
const normalized = new HTMLRewriter()
  .on('link[rel="preload"][as="fetch"][type="application/wasm"][integrity]', {
    element(link) {
      // Fetch preloads do not support SRI. Keep module and stylesheet SRI intact.
      link.removeAttribute("integrity");
    },
  })
  .transform(new Response(html));

await Bun.write(index, await normalized.text());
