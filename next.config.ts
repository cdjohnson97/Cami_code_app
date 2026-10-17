import type { NextConfig } from "next";

// The cloud backend (MongoDB + Google sign-in via Auth.js) is optional: it only switches on when
// every required server variable is present (see .env.local.example). Only the resulting boolean
// is exposed to the bundle — never the secrets themselves — so client components can hide the
// "Compte" card instead of calling an auth endpoint that isn't configured.
const cloudEnabled = Boolean(
  process.env.MONGODB_URI &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET
);

const nextConfig: NextConfig = {
  env: {
    CAMI_CLOUD_ENABLED: cloudEnabled ? "true" : "false",
  },
};

export default nextConfig;
