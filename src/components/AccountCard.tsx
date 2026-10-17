"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { cloudEnabled } from "@/lib/cloud/config";
import { useAuthStore } from "@/store/useAuthStore";

export function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authLoading = useAuthStore((s) => s.authLoading);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const [redirecting, setRedirecting] = useState(false);

  // Silently absent when the project owner hasn't set up the backend yet — no broken UI for it.
  if (!cloudEnabled) return null;

  function signInWithGoogle() {
    setRedirecting(true);
    void signIn("google", { redirectTo: window.location.pathname }); // back to this page (Réglages)
  }

  return (
    <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      <h3 className="text-base mb-1.5">Compte</h3>

      {authLoading ? (
        <p className="text-[13.5px]" style={{ color: "var(--ink-faint)" }}>Chargement…</p>
      ) : user ? (
        <>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
            Connecté·e avec Google en tant que <strong style={{ color: "var(--ink)" }}>{user.email ?? user.name}</strong>.
            Ta progression et tes préférences sont sauvegardées automatiquement et te suivent sur tous tes appareils.
          </p>
          <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: "var(--ink-faint)" }}>
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                background:
                  syncStatus === "synced" ? "var(--success)" : syncStatus === "error" ? "var(--error)" : "var(--warn)",
              }}
            />
            {syncStatus === "synced" && "Synchronisé"}
            {syncStatus === "syncing" && "Synchronisation…"}
            {syncStatus === "error" && "Erreur de synchronisation"}
            {syncStatus === "idle" && "En attente"}
          </div>
          <div className="flex gap-2.5">
            <button className="btn-ghost btn-sm" onClick={() => void signOut({ redirectTo: window.location.pathname })}>Se déconnecter</button>
            {isAdmin && <Link className="btn-ghost btn-sm" href="/admin">Tableau de bord admin</Link>}
          </div>
        </>
      ) : (
        <>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
            Connecte-toi pour sauvegarder ta progression et tes préférences en ligne, et les retrouver sur un autre
            appareil. Sans compte, tout reste sur cet appareil uniquement.
          </p>
          <button className="btn-primary btn-sm" disabled={redirecting} onClick={signInWithGoogle}>
            {redirecting ? "Redirection…" : "Se connecter avec Google"}
          </button>
        </>
      )}
    </div>
  );
}
