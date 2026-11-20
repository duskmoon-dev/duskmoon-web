const pagesBase = process.env.DOCS_BASE;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(pagesBase && {
    output: 'export',
    basePath: pagesBase.replace(/\/$/, ''),
    trailingSlash: true,
  }),
};

export default nextConfig;
