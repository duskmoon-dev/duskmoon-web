import type { NextConfig } from "next";

const pagesBase = process.env.DOCS_BASE;
const nextConfig: NextConfig = pagesBase ? {
  output: "export",
  basePath: pagesBase.replace(/\/$/, ""),
  trailingSlash: true,
} : {};

export default nextConfig;
