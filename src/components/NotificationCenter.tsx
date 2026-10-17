"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { findChapterEntry, isLastChapterOfPhase, nextChapterAfter, totalExerciseCount, completedCount } from "@/lib/progress";
import { Mascot } from "./Mascot";
import { Confetti } from "./Confetti";
import type { Badge } from "@/lib/types";

type Toast = { id: number; kind: "badge" | "teaser" | "simple"; icon?: string; title: string; text?: string };
type Modal = { title: string; message: string; mood: "celebrate" | "happy"; cta?: { label: string; onClick: () => void } };

let toastSeq = 0;

export function NotificationCenter() {
  const lastChapterCelebration = useAppStore((s) => s.lastChapterCelebration);
  const lastEarnedBadges = useAppStore((s) => s.lastEarnedBadges);
  const clearLastEarnedBadges = useAppStore((s) => s.clearLastEarnedBadges);
  const completed = useAppStore((s) => s.completed);
  const name = useAppStore((s) => s.name);
  const setCompletionDate = useAppStore((s) => s.setCompletionDate);
  const goTo = useAppStore((s) => s.goTo);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<Modal | null>(null);
  const [confettiToken, setConfettiToken] = useState(0);
  const handledCelebration = useRef<number | null>(null);
  const handledBadges = useRef<Badge[]>([]);

  function pushToast(t: Omit<Toast, "id">, ttl = 3600) {
    const id = ++toastSeq;
    setToasts((cur) => [...cur, { ...t, id }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), ttl);
  }

  // Badge unlock toasts
  useEffect(() => {
    if (!lastEarnedBadges.length || lastEarnedBadges === handledBadges.current) return;
    handledBadges.current = lastEarnedBadges;
    lastEarnedBadges.forEach((b, i) => {
      window.setTimeout(() => pushToast({ kind: "badge", icon: b.icon, title: `Badge débloqué — ${b.title}` }), i * 900);
    });
    window.setTimeout(() => clearLastEarnedBadges(), lastEarnedBadges.length * 900 + 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEarnedBadges]);

  // Chapter-complete celebration: confetti + toast/modal + next-chapter teaser
  useEffect(() => {
    if (!lastChapterCelebration || handledCelebration.current === lastChapterCelebration.token) return;
    handledCelebration.current = lastChapterCelebration.token;
    setConfettiToken(lastChapterCelebration.token);

    const entry = findChapterEntry(lastChapterCelebration.chapterId);
    if (!entry) return;
    const { chapter, phase } = entry;

    if (completedCount(completed) === totalExerciseCount()) {
      setCompletionDate(new Date().toISOString());
      setModal({
        title: "🏆 Le voyage est un succès !",
        message: `Bravo${name ? ", " + name : ""} — tu as appris à coder, du tout premier affichage jusqu'à l'intelligence artificielle. Variables, conditions, boucles, fonctions, classes, mini-IA : la logique est là, prête à affronter n'importe quel imprévu. La suite de l'histoire ? Elle est à toi de l'écrire, avec ton propre code.`,
        mood: "celebrate",
        cta: { label: "🎓 Voir mon certificat", onClick: () => goTo("certificat") },
      });
      return;
    }

    if (isLastChapterOfPhase(phase, chapter)) {
      setModal({
        title: "🎉 Partie terminée !",
        message: `${phase.label} est terminée${name ? ", " + name : ""} ! Une nouvelle partie du voyage commence.`,
        mood: "happy",
      });
      const next = nextChapterAfter(chapter.id);
      if (next?.teaser) {
        window.setTimeout(() => pushToast({ kind: "teaser", title: `À suivre · ${next.title}`, text: next.teaser }, 5000), 1500);
      }
      return;
    }

    pushToast({ kind: "simple", icon: "🎉", title: `Chapitre terminé : ${chapter.title}` });
    const next = nextChapterAfter(chapter.id);
    if (next?.teaser) {
      window.setTimeout(() => pushToast({ kind: "teaser", title: `À suivre · ${next.title}`, text: next.teaser }, 5000), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastChapterCelebration]);

  return (
    <>
      <Confetti token={confettiToken} />

      {/* top toasts: badges + simple chapter-complete */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[95] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.filter((t) => t.kind !== "teaser").map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="flex items-center gap-2.5 rounded-[10px] border-l-[3px] px-5 py-3 text-sm font-semibold whitespace-nowrap"
              style={{ background: "var(--paper)", borderColor: "var(--line)", borderLeftColor: "var(--accent)", color: "var(--ink)", boxShadow: "var(--shadow)" }}
            >
              {t.icon && <span className="text-xl">{t.icon}</span>}
              <span>{t.title}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* bottom teaser toasts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] flex flex-col items-center gap-2 pointer-events-none max-w-[90vw]">
        <AnimatePresence>
          {toasts.filter((t) => t.kind === "teaser").map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              className="flex flex-col gap-1 rounded-[10px] border-l-[3px] px-5 py-3 max-w-[420px]"
              style={{ background: "var(--paper)", borderColor: "var(--line)", borderLeftColor: "var(--accent)", boxShadow: "var(--shadow)" }}
            >
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>{t.title}</span>
              {t.text && <span className="text-[13.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>{t.text}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* celebration modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-5"
            style={{ background: "rgba(20,18,28,0.45)" }}
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-2xl border p-7 max-w-[400px] w-full text-center"
              style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-2"><Mascot mood={modal.mood} size={84} interactive={false} /></div>
              <h2 className="text-2xl font-semibold mb-2">{modal.title}</h2>
              <p className="text-[14.5px] mb-5" style={{ color: "var(--ink-soft)" }}>{modal.message}</p>
              <div className="flex gap-2.5 justify-center flex-wrap">
                {modal.cta && (
                  <button className="btn-ghost btn-sm" onClick={() => { setModal(null); modal.cta!.onClick(); }}>{modal.cta.label}</button>
                )}
                <button className="btn-primary btn-sm" onClick={() => setModal(null)}>Continuer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
