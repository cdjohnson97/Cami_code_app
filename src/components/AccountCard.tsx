"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { cloudEnabled } from "@/lib/cloud/config";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { accord } from "@/lib/genre";
import { pickPreferences, pickProgress } from "@/lib/cloud/shape";

export function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authLoading = useAuthStore((s) => s.authLoading);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const gender = useAppStore((s) => s.gender);
  const [redirecting, setRedirecting] = useState(false);
  const [signOutState, setSignOutState] = useState<"idle" | "saving" | "failed">("idle");

  // Silently absent when the project owner hasn't set up the backend yet — no broken UI for it.
  if (!cloudEnabled) return null;

  function signInWithGoogle() {
    setRedirecting(true);
    void signIn("google", { redirectTo: window.location.pathname }); // back to this page (Réglages)
  }

  /**
   * Signing out wipes this device's progress (on a shared computer, the next learner must not
   * inherit it — sign-in MERGES local progress into the account). So first make sure the latest
   * state is saved on the account: the regular sync is debounced and may be a second behind.
   */
  async function signOutSafely(force = false) {
    if (!force) {
      setSignOutState("saving");
      const state = useAppStore.getState();
      const saved = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: pickProgress(state), preferences: pickPreferences(state) }),
      }).then((r) => r.ok, () => false);
      if (!saved) {
        setSignOutState("failed");
        return;
      }
    }
    // Order matters: forget the user FIRST, so CloudSync's debounced push (which only runs for
    // a signed-in user) can't send the wiped, empty state to the account during the redirect.
    useAuthStore.getState().setUser(null);
    useAppStore.getState().resetProgress();
    void signOut({ redirectTo: "/" });
  }

  return (
    <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      <h3 className="text-base mb-1.5">Compte</h3>

      {authLoading ? (
        <p className="text-[13.5px]" style={{ color: "var(--ink-faint)" }}>Chargement…</p>
      ) : user ? (
        <>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
            {accord(gender, "Connecté", "Connectée", "Connecté·e")} avec Google en tant que <strong style={{ color: "var(--ink)" }}>{user.email ?? user.name}</strong>.
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
            <button className="btn-ghost btn-sm" disabled={signOutState === "saving"} onClick={() => void signOutSafely()}>
              {signOutState === "saving" ? "Enregistrement…" : "Se déconnecter"}
            </button>
            {isAdmin && <Link className="btn-ghost btn-sm" href="/admin">Tableau de bord admin</Link>}
          </div>
          {signOutState === "failed" ? (
            <div className="mt-3 text-[13px]" style={{ color: "var(--error)" }}>
              Impossible d&apos;enregistrer ta progression sur ton compte (pas de connexion ?). Réessaie quand le
              réseau revient — en te déconnectant maintenant, ce qui n&apos;a pas encore été synchronisé serait perdu.
              <div className="mt-2">
                <button className="btn-ghost btn-sm" onClick={() => void signOutSafely(true)}>Se déconnecter quand même</button>
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
        </>
      )}
    </div>
  );
}
