import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.DOCS_SITE,
  base: process.env.DOCS_BASE,
  vite: {
    plugins: [tailwindcss()],
  },
});
