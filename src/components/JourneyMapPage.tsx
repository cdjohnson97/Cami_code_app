"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { flatChapters, chapterDone, isChapterUnlocked } from "@/lib/progress";
import { MAP_ICONS } from "@/lib/curriculum";
import { AppLink } from "./AppLink";
import { useLoginGate } from "@/lib/loginGate";
import { Mascot } from "./Mascot";

export function JourneyMapPage() {
  const completed = useAppStore((s) => s.completed);
  const gate = useLoginGate();
  const flat = flatChapters();

  let currentSet = false;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl m-0">Carte du voyage</h1>
        <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold">
          Sentier d&apos;apprentissage
        </span>
      </div>
      <p className="text-[14.5px] mb-8" style={{ color: "var(--ink-soft)" }}>
        Toutes les étapes du parcours. CaMI t&apos;accompagne et indique où tu en es dans l&apos;aventure.
      </p>

      <div className="flex flex-col max-w-[640px] relative">
        {flat.map((x, i) => {
          const done = chapterDone(x.chapter, completed);
          const unlocked = isChapterUnlocked(x.chapter.id, completed);
          const isCurrent = !done && unlocked && !currentSet;
          if (isCurrent) currentSet = true;
          const icon = MAP_ICONS[x.chapter.id] || "📍";
          const passedCount = x.chapter.exercises.filter((e) => completed[e.id]).length;
          const totalEx = x.chapter.exercises.length;

          return (
            <div key={x.chapter.id} className="flex gap-4 relative pb-7 last:pb-0">
              {/* Ligne de connexion d'aventure entre les étapes */}
              {i < flat.length - 1 && (
                <div
                  className="absolute left-[23px] top-[48px] bottom-0 w-[3px] rounded-full transition-colors duration-500"
                  style={{
                    background: done
                      ? "var(--success)"
                      : isCurrent
                      ? "linear-gradient(to bottom, var(--accent) 0%, var(--line-strong) 100%)"
                      : "var(--line)",
                  }}
                >
                  {/* Impulsion lumineuse animée sur le chemin actif */}
                  {isCurrent && (
                    <motion.div
                      className="w-full h-4 rounded-full"
                      style={{ background: "#FACC15" }}
                      animate={{ y: [0, 45, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              )}

              {/* Jalon / Pastille d'étape avec le pion CaMI interactif */}
              <div className="relative flex-none">
                {/* Pion CaMI en train de flotter sur l'étape en cours */}
                {isCurrent && (
                  <motion.div
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: [0, -6, 0], opacity: 1 }}
                    transition={{
                      y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                      opacity: { duration: 0.3 },
                    }}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  >
                    <div className="relative">
                      <Mascot mood="wave" size={40} interactive={false} />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-black/15 blur-[1px]" />
                    </div>
                  </motion.div>
                )}

                <motion.span
                  initial={false}
                  animate={
                    isCurrent
                      ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 0px rgba(59,130,246,0.3)", "0 0 0 8px rgba(59,130,246,0)", "0 0 0 0px rgba(59,130,246,0.3)"] }
                      : {}
                  }
                  transition={{ duration: 2.2, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-[21px] border-[2.5px] relative z-[1] shadow-sm select-none"
                  style={
                    done
                      ? { borderColor: "var(--success)", background: "var(--success-soft)" }
                      : isCurrent
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
                      : { borderColor: "var(--line-strong)", background: "var(--paper)", opacity: unlocked ? 1 : 0.45 }
                  }
                >
                  {done ? "✓" : icon}
                </motion.span>
              </div>

              {/* Carte d'étape cliquable avec micro-interactions */}
              {(() => {
                const className =
                  "flex-1 text-left rounded-xl border px-4 py-3.5 mt-0.5 no-underline transition-all duration-200 block";
                const style = {
                  background: isCurrent ? "var(--paper)" : "var(--paper)",
                  borderColor: isCurrent ? "var(--accent)" : "var(--line)",
                  color: "var(--ink)",
                  boxShadow: isCurrent ? "var(--shadow-lg)" : "var(--shadow)",
                };
                const content = (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
                          {x.phase.shortLabel}
                        </span>
                        {isCurrent && (
                          <span
                            className="text-[10px] uppercase font-bold font-mono px-1.5 py-0.2 rounded"
                            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
                          >
                            Étape active
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[15px] block">{x.chapter.title}</span>
                      <span
                        className="block text-xs mt-1"
                        style={{ color: done ? "var(--success)" : isCurrent ? "var(--accent)" : "var(--ink-faint)" }}
                      >
                        {done
                          ? `Terminé (${totalEx}/${totalEx})`
                          : !unlocked
                          ? "🔒 Verrouillé"
                          : gate.mustSignIn(x.chapter.id)
                          ? "🔐 Connexion requise"
                          : isCurrent
                          ? `En cours · ${passedCount}/${totalEx} validé${passedCount > 1 ? "s" : ""}`
                          : "Disponible"}
                      </span>
                    </div>

                    {unlocked && (
                      <span className="text-[13px] font-semibold opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" style={{ color: isCurrent ? "var(--accent)" : "var(--ink-faint)" }}>
                        {isCurrent ? "Continuer →" : "Voir →"}
                      </span>
                    )}
                  </div>
                );

                return unlocked ? (
                  <motion.div
                    whileHover={{ scale: 1.015, x: 3 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex-1"
                  >
                    <AppLink to={x.chapter.id} className={className} style={{ ...style, cursor: "pointer" }}>
                      {content}
                    </AppLink>
                  </motion.div>
                ) : (
                  <div aria-disabled="true" className={className} style={{ ...style, cursor: "not-allowed", opacity: 0.6 }}>
                    {content}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
