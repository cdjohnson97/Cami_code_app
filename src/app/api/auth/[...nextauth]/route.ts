import { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";

// Auth.js endpoints (/api/auth/signin/google, /api/auth/callback/google, /api/auth/session…).
// Answer 404 when the backend isn't configured rather than letting Auth.js throw on missing env.
const notConfigured = () => new Response(null, { status: 404 });

/**
 * Behind a hosting platform's HTTPS proxy (Render, Cloud Run…), the Next.js standalone server
 * rebuilds the request URL from the address it listens on — `0.0.0.0:3000` inside the container.
 * Auth.js derives the Google `redirect_uri` from that URL, so Google received
 * `https://0.0.0.0:3000/api/auth/callback/google` and blocked sign-in ("Erreur 400 :
 * invalid_request"). Rebuild the public URL from the proxy's forwarded headers instead.
 * An explicit AUTH_URL, when set, keeps priority (Auth.js applies it itself).
 */
function withPublicUrl(request: NextRequest): NextRequest {
  if (process.env.AUTH_URL) return request;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))?.split(",")[0].trim();
  if (!host) return request;
  const proto = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  const publicUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, `${proto}://${host}`);
  return publicUrl.origin === request.nextUrl.origin ? request : new NextRequest(publicUrl, request);
}

export function GET(request: NextRequest) {
  return cloudEnabled ? handlers.GET(withPublicUrl(request)) : notConfigured();
}

export function POST(request: NextRequest) {
  return cloudEnabled ? handlers.POST(withPublicUrl(request)) : notConfigured();
}
