/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: { externalDir: true },
  webpack(config) {
    // Shared engine uses NodeNext-style .js specifiers in .ts source files.
    // Resolve those specifiers to TypeScript sources during Next.js bundling.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};
export default nextConfig;
