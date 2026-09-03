import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// The monorepo keeps one .env at the root; Next only reads env files from this
// package, so without this the NEXT_PUBLIC_* vars are undefined outside Vercel.
loadEnv({ path: "../.env" });

const nextConfig: NextConfig = {
    turbopack: {},
    reactCompiler: true,
};

export default nextConfig;
