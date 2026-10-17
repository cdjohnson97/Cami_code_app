"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AccountCard } from "./AccountCard";
import { InstallCard } from "./InstallCard";

export function SettingsPage() {
  const name = useAppStore((s) => s.name);
  const setName = useAppStore((s) => s.setName);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const soundOn = useAppStore((s) => s.soundOn);
  const setSoundOn = useAppStore((s) => s.setSoundOn);
  const resetProgress = useAppStore((s) => s.resetProgress);

  const [draft, setDraft] = useState(name || "");
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div>
      <h1 className="text-2xl mb-7">Réglages</h1>

      <AccountCard />
      <InstallCard />

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <h3 className="text-base mb-1.5">Ton prénom</h3>
        <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>Utilisé pour personnaliser les messages et le certificat.</p>
        <div className="flex gap-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ton prénom"
            className="rounded-[9px] border px-3 py-2 text-[14.5px] outline-none flex-1 max-w-[240px]"
            style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
          />
          <button className="btn-primary btn-sm" onClick={() => setName(draft.trim() || null)}>Enregistrer</button>
        </div>
      </div>

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <h3 className="text-base mb-3">Thème</h3>
        <div className="flex gap-2 flex-wrap">
          {(["auto", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="rounded-lg border px-3.5 py-2 text-[13.5px]"
              style={theme === t ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)", fontWeight: 600 } : { borderColor: "var(--line-strong)", color: "var(--ink-soft)", background: "var(--bg)" }}
            >
              {t === "auto" ? "🖥 Automatique" : t === "light" ? "☀️ Clair" : "🌙 Sombre"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <h3 className="text-base mb-1.5">Sons</h3>
        <label className="flex items-center gap-2 text-[13.5px] cursor-pointer" style={{ color: "var(--ink-soft)" }}>
          <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
          Activer les sons de réussite
        </label>
      </div>

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px]" style={{ background: "var(--paper)", borderColor: "var(--error)" }}>
        <h3 className="text-base mb-1.5">Réinitialiser la progression</h3>
        <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>Efface tout ton avancement, tes badges et ton certificat. Irréversible.</p>
        {!confirmReset ? (
          <button className="btn-ghost btn-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }} onClick={() => setConfirmReset(true)}>
            Réinitialiser tout
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="text-[13.5px]" style={{ color: "var(--error)" }}>Tu es sûr·e ?</span>
            <button className="btn-primary btn-sm" style={{ background: "var(--error)" }} onClick={() => { resetProgress(); setConfirmReset(false); }}>Oui, tout effacer</button>
            <button className="btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}
