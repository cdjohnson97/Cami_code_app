"use client";

import dynamic from "next/dynamic";

// The whole learning app is client-only (localStorage-backed Zustand store, browser-only engine
// UI), so it's loaded with ssr:false — the server only sends this placeholder.
const AppShell = dynamic(() => import("@/components/AppShell").then((m) => m.AppShell), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <span className="font-display text-lg" style={{ color: "var(--ink-faint)" }}>CaMI…</span>
    </div>
  ),
});

export function ClientApp() {
  return <AppShell />;
}
