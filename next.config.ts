import type { NextConfig } from "next";

// The cloud backend (MongoDB + Google sign-in via Auth.js) is optional. It switches on when every
// required server variable is present (see .env.local.example) — or when CAMI_CLOUD_ENABLED=true
// is set explicitly, which is how the Docker image is built: secrets are only given to the
// container at run time and must never be baked into the image (see Dockerfile).
// Only the resulting boolean is exposed to the bundle — never the secrets themselves — so client
// components can hide the "Compte" card instead of calling an auth endpoint that isn't configured.
const cloudEnabled =
  process.env.CAMI_CLOUD_ENABLED === "true" ||
  Boolean(
    process.env.MONGODB_URI &&
      process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET
  );

const nextConfig: NextConfig = {
  // Self-contained server (.next/standalone/server.js + only the node_modules it needs):
  // what the Docker image ships.
  output: "standalone",
  env: {
    CAMI_CLOUD_ENABLED: cloudEnabled ? "true" : "false",
  },
};

export default nextConfig;
