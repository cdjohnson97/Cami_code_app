"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { cloudEnabled } from "@/lib/cloud/config";
import { signOutSafely } from "@/lib/signOut";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { accord } from "@/lib/genre";

export function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authLoading = useAuthStore((s) => s.authLoading);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const gender = useAppStore((s) => s.gender);
  const [redirecting, setRedirecting] = useState(false);
  const [signOutState, setSignOutState] = useState<"idle" | "saving" | "failed">("idle");
  const [role, setRole] = useState<string | null>(null);

  // Silently absent when the project owner hasn't set up the backend yet — no broken UI for it.
  if (!cloudEnabled) return null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/me");
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) setRole(d.role ?? null);
      } catch {
        // role unknown — keep default
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function signInWithGoogle() {
    setRedirecting(true);
    void signIn("google", { redirectTo: window.location.pathname }); // back to this page (Réglages)
  }

  /**
   * Signing out wipes this device's progress: `signOutSafely` first pushes the latest state to
   * the account, then clears the local stores and the Auth.js session.
   */
  async function handleSignOut(force = false) {
    if (!force) setSignOutState("saving");
    const ok = await signOutSafely({ force });
    if (!ok) setSignOutState("failed");
  }

  return (
    <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      <h3 className="text-base mb-1.5">Compte</h3>

      {authLoading ? (
        <p className="text-[13.5px]" style={{ color: "var(--ink-faint)" }}>Chargement…</p>
      ) : user ? (
        <>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
            {accord(gender, "Connecté", "Connectée", "Connecté·e")} en tant que <strong style={{ color: "var(--ink)" }}>{user.email ?? user.name}</strong>.
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
          <div className="flex gap-2.5 flex-wrap">
            <button className="btn-ghost btn-sm" disabled={signOutState === "saving"} onClick={() => void handleSignOut()}>
              {signOutState === "saving" ? "Enregistrement…" : "Se déconnecter"}
            </button>
            {isAdmin && <Link className="btn-ghost btn-sm" href="/admin">Tableau de bord admin</Link>}
            {role === "teacher" && <Link className="btn-ghost btn-sm" href="/enseignant">Mon espace enseignant</Link>}
            {role === "student" && <Link className="btn-ghost btn-sm" href="/eleve">Mon espace élève</Link>}
            {role === null && <Link className="btn-ghost btn-sm" href="/enseignant">Mon espace enseignant</Link>}
          </div>
          {signOutState === "failed" ? (
            <div className="mt-3 text-[13px]" style={{ color: "var(--error)" }}>
              Impossible d&apos;enregistrer ta progression sur ton compte (pas de connexion ?). Réessaie quand le
              réseau revient — en te déconnectant maintenant, ce qui n&apos;a pas encore été synchronisé serait perdu.
              <div className="mt-2">
                <button className="btn-ghost btn-sm" onClick={() => void handleSignOut(true)}>Se déconnecter quand même</button>
              </div>
            </div>
          ) : (
            <p className="text-xs mt-3 mb-0" style={{ color: "var(--ink-faint)" }}>
              À la déconnexion, la progression est retirée de cet appareil (elle reste sur ton compte).
            </p>
          )}
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
          <button
            className="btn-ghost btn-sm mt-2.5 w-full"
            onClick={() => void window.location.assign("/login")}
          >
            Se connecter avec un email
          </button>
        </>
      )}
    </div>
  );
}
