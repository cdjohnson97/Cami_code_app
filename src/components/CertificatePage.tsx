"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { completedCount, flatChapters, totalExerciseCount } from "@/lib/progress";
import { Mascot } from "./Mascot";

export function CertificatePage() {
  const completed = useAppStore((s) => s.completed);
  const name = useAppStore((s) => s.name);
  const setName = useAppStore((s) => s.setName);
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  const completionDate = useAppStore((s) => s.completionDate);
  const goTo = useAppStore((s) => s.goTo);

  const total = totalExerciseCount();
  const done = completedCount(completed);
  const finished = total > 0 && done === total;
  const [draft, setDraft] = useState("");

  if (!finished) {
    return (
      <div className="flex flex-col items-center text-center max-w-[52ch] mx-auto my-16 px-8 py-9 rounded-(--radius) border" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <Mascot mood="think" size={76} interactive={false} className="mb-2.5" />
        <span className="font-mono text-xs uppercase tracking-wide mb-2.5" style={{ color: "var(--ink-faint)" }}>🔒 Pas encore débloqué</span>
        <h2 className="text-xl mb-2.5">Termine le parcours pour l&apos;obtenir</h2>
        <p className="text-[14.5px] leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }}>
          Il te reste {total - done} exercice{total - done > 1 ? "s" : ""} sur {total}. Continue, tu y es presque !
        </p>
        <button className="btn-primary" onClick={() => goTo("carte")}>Continuer le parcours →</button>
      </div>
    );
  }

  const dateStr = completionDate ? new Date(completionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div>
      {!name && (
        <div className="max-w-[480px] rounded-(--radius) border px-5 py-4 mb-5 flex flex-col gap-2.5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
          <p className="text-[13.5px] m-0" style={{ color: "var(--ink-soft)" }}>Pour personnaliser ton certificat, indique ton prénom :</p>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ton prénom"
            maxLength={30}
            className="rounded-[9px] border px-3 py-2.5 text-[14.5px] outline-none"
            style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
          />
          <button className="btn-primary btn-sm self-start" onClick={() => draft.trim() && setName(draft.trim())}>Enregistrer</button>
        </div>
      )}

      <div className="max-w-[640px] mx-auto mt-7 mb-2 px-10 py-11 rounded-2xl border-[3px] text-center relative" style={{ borderColor: "var(--accent)", background: "var(--paper)", boxShadow: "var(--shadow-lg)", borderStyle: "double" }}>
        <div className="inline-block font-mono text-[13px] font-bold rounded-[6px] border-[1.5px] px-2 py-0.5 mb-2.5" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>{"</>"}</div>
        <div className="flex justify-center mb-1.5"><Mascot mood="celebrate" size={64} interactive={false} /></div>
        <span className="block font-mono text-xs uppercase tracking-wide mb-3.5" style={{ color: "var(--ink-faint)" }}>Certificat de réussite</span>
        <h2 className="font-display text-[clamp(26px,4vw,36px)] mb-2">{name || "Toi"}</h2>
        <p className="text-[14.5px] m-0" style={{ color: "var(--ink-soft)" }}>a terminé avec succès le parcours</p>
        <h3 className="font-display text-[17px] font-semibold my-1.5" style={{ color: "var(--accent)" }}>
          CaMI — Algorithmique, Python et intelligence artificielle
        </h3>
        <div className="flex justify-center gap-7 flex-wrap my-5">
          <div className="flex flex-col items-center">
            <b className="font-display text-2xl">{total}</b>
            <span className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-faint)" }}>exercices réussis</span>
          </div>
          <div className="flex flex-col items-center">
            <b className="font-display text-2xl">{flatChapters().length}</b>
            <span className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-faint)" }}>chapitres complétés</span>
          </div>
          <div className="flex flex-col items-center">
            <b className="font-display text-2xl">{Object.keys(earnedBadges).length}</b>
            <span className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-faint)" }}>badges obtenus</span>
          </div>
        </div>
        <div className="font-mono text-xs pt-3.5 border-t" style={{ color: "var(--ink-faint)", borderColor: "var(--line)" }}>{dateStr}</div>
      </div>

      <div className="max-w-[640px] mx-auto mt-5 text-center no-print">
        <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimer / Enregistrer en PDF</button>
      </div>
    </div>
  );
}
