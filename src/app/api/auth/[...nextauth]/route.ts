import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";

// Auth.js endpoints (/api/auth/signin/google, /api/auth/callback/google, /api/auth/session…).
// Answer 404 when the backend isn't configured rather than letting Auth.js throw on missing env.
const notConfigured = () => new Response(null, { status: 404 });

export function GET(request: NextRequest) {
  return cloudEnabled ? handlers.GET(request) : notConfigured();
}

export function POST(request: NextRequest) {
  return cloudEnabled ? handlers.POST(request) : notConfigured();
}
