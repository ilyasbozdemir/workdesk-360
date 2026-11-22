import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@worksuite-360/core", "@temin360/direct-procurement-core"],
  serverExternalPackages: ["better-sqlite3", "node:sqlite"],
};

export default nextConfig;
