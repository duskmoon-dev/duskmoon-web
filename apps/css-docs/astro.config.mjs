import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { resolve } from "path";
import { rebaseSatteriLinks } from "../../scripts/pages/markdown-links.mjs";

import tailwindcss from "@tailwindcss/vite";

const isProduction = process.env.NODE_ENV === "production";
const coreSourceDir = resolve(import.meta.dirname, "../../packages/css/core/src");
const cssArtSourceDir = resolve(import.meta.dirname, "../../packages/css/css-art/src");
const defaultBase = "/duskmoonui";
const base = process.env.DOCS_BASE ?? defaultBase;

export default defineConfig({
  site: process.env.DOCS_SITE ?? "https://duskmoon-dev.github.io",
  base,
  trailingSlash: "always",

  // Markdown configuration
  markdown: {
    ...(base !== defaultBase && {
      processor: satteri({ mdastPlugins: [rebaseSatteriLinks(defaultBase, base)] }),
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false, // Use CSS variables for theme switching
      wrap: true,
    },
  },

  // Integrations
  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          fr: "fr-FR",
          es: "es-ES",
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: isProduction
        ? {}
        : [
            // In dev mode, use source files for hot reload
            { find: /^@duskmoon-dev\/core$/, replacement: resolve(coreSourceDir, "index.css") },
            { find: /^@duskmoon-dev\/core\/effects\/(.+)\.css$/, replacement: `${coreSourceDir}/effects/$1.css` },
            { find: /^@duskmoon-dev\/css-art$/, replacement: resolve(cssArtSourceDir, "index.css") },
          ],
    },
    optimizeDeps: {
      // Exclude core package from pre-bundling to enable hot reload
      exclude: ["@duskmoon-dev/core", "@duskmoon-dev/css-art"],
    },
    server: {
      fs: {
        // Allow serving files from core source directory and monorepo root
        allow: [coreSourceDir, cssArtSourceDir, ".", "../.."],
      },
      watch: {
        // Use polling for better cross-platform compatibility in monorepos
        usePolling: true,
        interval: 100,
      },
    },
    css: {
      // Enable CSS hot reload for imported stylesheets
      devSourcemap: true,
    },
  },
});
