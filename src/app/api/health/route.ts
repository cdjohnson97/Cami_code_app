// Liveness probe for the container (Docker HEALTHCHECK, hosting platforms). Deliberately does
// NOT touch MongoDB: a database hiccup must not get a healthy app container killed and restarted.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
