// Inlined at build time from next.config.ts (true only when MongoDB + Google sign-in are fully
// configured). Safe to import from both client and server code.
export const cloudEnabled = process.env.CAMI_CLOUD_ENABLED === "true";
