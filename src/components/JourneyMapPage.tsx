"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { flatChapters, chapterDone, isChapterUnlocked } from "@/lib/progress";
import { MAP_ICONS } from "@/lib/curriculum";
import { AppLink } from "./AppLink";
import { useLoginGate } from "@/lib/loginGate";

export function JourneyMapPage() {
  const completed = useAppStore((s) => s.completed);
  const gate = useLoginGate();
  const flat = flatChapters();

  let currentSet = false;

  return (
    <div>
      <h1 className="text-2xl mb-2">Carte du voyage</h1>
      <p className="text-[14.5px] mb-7" style={{ color: "var(--ink-soft)" }}>Toutes les étapes du parcours, dans l&apos;ordre.</p>

      <div className="flex flex-col max-w-[640px]">
        {flat.map((x, i) => {
          const done = chapterDone(x.chapter, completed);
          const unlocked = isChapterUnlocked(x.chapter.id, completed);
          const isCurrent = !done && unlocked && !currentSet;
          if (isCurrent) currentSet = true;
          const icon = MAP_ICONS[x.chapter.id] || "📍";

          return (
            <div key={x.chapter.id} className="flex gap-4 relative pb-6 last:pb-0">
              {i < flat.length - 1 && (
                <div className="absolute left-[21px] top-[46px] bottom-0 w-0.5" style={{ background: done ? "var(--success)" : "var(--line-strong)" }} />
              )}
              <motion.span
                initial={false}
                animate={isCurrent ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 1.8, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
                className="flex-none w-11 h-11 rounded-full flex items-center justify-center text-[19px] border-2 relative z-[1]"
                style={
                  done
                    ? { borderColor: "var(--success)", background: "var(--success-soft)" }
                    : isCurrent
                    ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
                    : { borderColor: "var(--line-strong)", background: "var(--paper)", opacity: unlocked ? 1 : 0.5 }
                }
              >
                {icon}
              </motion.span>
              {(() => {
                const className = "flex-1 text-left rounded-xl border px-4 py-3 mt-0.5 no-underline";
                const style = { background: "var(--paper)", borderColor: "var(--line)", color: "var(--ink)" };
                const content = (
                  <>
                    <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-faint)" }}>{x.phase.shortLabel}</span>
                    <span className="font-bold text-[14.5px]">{x.chapter.title}</span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: done ? "var(--success)" : isCurrent ? "var(--accent)" : "var(--ink-faint)" }}
                    >
                      {done ? "Terminé" : !unlocked ? "Verrouillé" : gate.mustSignIn(x.chapter.id) ? "🔐 Connexion requise" : isCurrent ? "En cours" : "Disponible"}
                    </span>
                  </>
                );
                return unlocked ? (
                  <AppLink to={x.chapter.id} className={className} style={{ ...style, cursor: "pointer" }}>{content}</AppLink>
                ) : (
                  <div aria-disabled="true" className={className} style={{ ...style, cursor: "not-allowed" }}>{content}</div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
