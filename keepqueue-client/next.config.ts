import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// The monorepo keeps one .env at the root; Next only reads env files from this
// package, so without this the NEXT_PUBLIC_* vars are undefined outside Vercel.
loadEnv({ path: "../.env" });

const CANONICAL_ORIGIN = "https://keepqueue.com";
const VERCEL_PRODUCTION_HOST = "keepqueue-v0.vercel.app";

const nextConfig: NextConfig = {
    turbopack: {},
    reactCompiler: true,
    async redirects() {
        return [
            {
                source: "/:path*",
                has: [{ type: "host", value: VERCEL_PRODUCTION_HOST }],
                destination: `${CANONICAL_ORIGIN}/:path*`,
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
