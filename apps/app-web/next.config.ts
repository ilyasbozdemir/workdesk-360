import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["@worksuite-360/contracts", "@dt/database"],
};

export default nextConfig;
