import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@temin360/direct-procurement-core"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
