import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@worksuite-360/core"],
  serverExternalPackages: ["better-sqlite3", "node:sqlite", "adm-zip"],
};

export default nextConfig;
