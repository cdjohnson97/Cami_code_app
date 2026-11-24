"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { cloudEnabled } from "@/lib/cloud/config";
import { signOutSafely } from "@/lib/signOut";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { accord } from "@/lib/genre";
import { swal } from "@/lib/swal";

export function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authLoading = useAuthStore((s) => s.authLoading);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const name = useAppStore((s) => s.name);
  const gender = useAppStore((s) => s.gender);
  const setName = useAppStore((s) => s.setName);
  const setGender = useAppStore((s) => s.setGender);
  const [redirecting, setRedirecting] = useState(false);
  const [signOutState, setSignOutState] = useState<"idle" | "saving" | "failed">("idle");
  const [role, setRole] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [genderDraft, setGenderDraft] = useState<"f" | "m" | null>(null);

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

  async function handleSaveInfos() {
    if (!nameDraft.trim()) {
      await swal({
        icon: "error",
        title: "Prénom requis",
        text: "Saisis un prénom pour continuer.",
        confirmButtonText: "OK",
      });
      return;
    }
    setName(nameDraft.trim());
    setGender(genderDraft);
    setEditing(false);
    await swal({
      icon: "success",
      title: "Infos mises à jour",
      text: "Tes informations personnelles ont été enregistrées.",
      confirmButtonText: "OK",
    });
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

          {/* Infos personnelles */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
              Tes informations personnelles
            </h4>
            {editing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--ink-soft)" }}>
                    Prénom
                  </label>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                    style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--ink-soft)" }}>
                    Accord (« prêt » / « prête »)
                  </label>
                  <select
                    value={genderDraft ?? ""}
                    onChange={(e) => setGenderDraft(e.target.value as any)}
                    className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                    style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                  >
                    <option value="">Ne pas préciser</option>
                    <option value="m">Masculin (« prêt »)</option>
                    <option value="f">Féminin (« prête »)</option>
                    <option value="n">Neutre (« prêt·e »)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>
                    {name ? `Bonjour ${name}!` : "Prénom non renseigné"}
                  </span>
                  {gender && (
                    <span className="text-[12px]" style={{ color: "var(--ink-soft)" }}>
                      ({accord(gender, "prêt", "prête", "prêt·e")})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNameDraft(name ?? "");
                    setGenderDraft(gender);
                    setEditing(true);
                  }}
                  className="btn-ghost btn-sm text-[12px]"
                >
                  Modifier
                </button>
              </div>
            )}
            {editing && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSaveInfos}
                  disabled={!nameDraft.trim()}
                  className="btn-primary btn-sm text-[13px] px-4"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-ghost btn-sm text-[13px] px-4"
                >
                  Annuler
                </button>
              </div>
            )}
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

