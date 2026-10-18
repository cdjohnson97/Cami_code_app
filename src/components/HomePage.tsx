"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import type { MascotMood } from "@/lib/types";
import { PHASE_ORDER, CURRICULUM } from "@/lib/curriculum";
import { PART_META } from "@/lib/partMeta";
import { chapterDone, completedCount, firstUnfinishedChapterId, isChapterUnlocked, phaseProgress, totalExerciseCount } from "@/lib/progress";
import { Mascot } from "./Mascot";
import type { Chapter } from "@/lib/types";
import { accord } from "@/lib/genre";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const CAMI_LETTERS = ["C", "a", "M", "I"];
const letters: Variants = {
  hidden: {},
  // Wait for the mascot to hop in and start waving, then the wordmark bounces in behind it.
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.5 } },
};
const letterPop: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.4, rotate: -12 },
  show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 460, damping: 13 } },
};

export function HomePage() {
  const completed = useAppStore((s) => s.completed);
  const name = useAppStore((s) => s.name);
  const gender = useAppStore((s) => s.gender);
  const goTo = useAppStore((s) => s.goTo);

  const total = totalExerciseCount();
  const done = completedCount(completed);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const started = done > 0;
  const targetId = firstUnfinishedChapterId(completed);

  // Greet with a wave for a moment when the home page first shows up, then settle into the
  // usual idle/happy sway.
  const [heroMood, setHeroMood] = useState<MascotMood>("wave");
  useEffect(() => {
    const t = window.setTimeout(() => setHeroMood(started ? "happy" : "celebrate"), 1700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* ---- Hero ---- */}
      <motion.div initial="hidden" animate="show" variants={container} className="pt-4 pb-4 flex flex-col items-center text-center">
        <motion.div className="flex flex-col items-center gap-2 mb-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
          >
            <motion.div
              animate={{ rotate: [0, -4, 4, -2, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut", delay: 0.6 }}
            >
              <Mascot mood={heroMood} size={92} />
            </motion.div>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={letters}
            className="font-display text-[26px] font-bold tracking-tight leading-none flex items-center"
          >
            {CAMI_LETTERS.map((ch, i) => (
              <motion.span
                key={i}
                variants={letterPop}
                className="inline-block"
                style={i >= 2 ? { color: "var(--accent)" } : undefined}
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              aria-hidden="true"
              className="inline-block ml-1.5 origin-bottom"
              initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, 22, -12, 22, -8, 0] }}
              transition={{
                opacity: { delay: 0.95, duration: 0.25 },
                scale: { delay: 0.95, duration: 0.25, type: "spring", stiffness: 400, damping: 12 },
                rotate: { delay: 0.95, duration: 1.3, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" },
              }}
            >
              👋
            </motion.span>
          </motion.div>
        </motion.div>

        <motion.span variants={item} className="font-mono text-[12.5px] tracking-wide uppercase font-semibold mb-3.5 inline-block" style={{ color: "var(--accent)" }}>
          ton copilote pour apprendre à coder
        </motion.span>

        <motion.div variants={item} className="max-w-[42ch]">
          <h1 className="text-[clamp(28px,4.2vw,42px)] leading-[1.1]">
            {name ? `Salut ${name}, ${accord(gender, "prêt", "prête", "prêt·e")} à coder ?` : "Apprends à coder, puis apprivoise l'IA"}
          </h1>
          <p className="text-[17.5px] mt-4" style={{ color: "var(--ink-soft)" }}>
            Un parcours simple et ludique, en petites étapes : de la toute première variable jusqu&apos;à construire tes propres mini-intelligences artificielles — pas de jargon, que du concret, à ton rythme.
          </p>
        </motion.div>

        <motion.div variants={item} className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <button className="btn-primary" onClick={() => goTo(targetId)}>
            {started ? "Continuer le parcours" : "Commencer l'aventure"} →
          </button>
          <button className="btn-ghost" onClick={() => goTo("carte")}>🗺️ Voir la carte du voyage</button>
        </motion.div>

        {started && (
          <motion.div
            variants={item}
            className="mt-7 max-w-[420px] w-full rounded-(--radius) border px-5 py-4"
            style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}
          >
            <div className="flex justify-between text-[13px] mb-2" style={{ color: "var(--ink-soft)" }}>
              <span>Progression globale</span><span>{done}/{total} exercices</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
              <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ---- Roadmap / the 4 parts ---- */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={container}
        className="mt-14"
      >
        <motion.div variants={item} className="mb-1">
          <span className="text-xs uppercase tracking-wide font-bold" style={{ color: "var(--ink-faint)" }}>Le voyage en 4 parties</span>
        </motion.div>
        <motion.p variants={item} className="text-[15px] max-w-[60ch] mt-1 mb-6" style={{ color: "var(--ink-soft)" }}>
          Chaque partie débloque la suivante. La toute dernière n&apos;est plus une leçon de syntaxe : c&apos;est ton premier vrai contact avec l&apos;intelligence artificielle, codée de tes propres mains.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PHASE_ORDER.map((pid, i) => {
            const phase = CURRICULUM[pid];
            const meta = PART_META[pid];
            const prog = phaseProgress(phase, completed);
            const phaseUnlocked = phase.chapters.length > 0 && isChapterUnlocked(phase.chapters[0].id, completed);
            const phaseDone = phase.chapters.every((c: Chapter) => chapterDone(c, completed));
            const firstChapterId = phase.chapters[0]?.id;

            return (
              <motion.button
                key={pid}
                variants={item}
                onClick={() => phaseUnlocked && firstChapterId && goTo(firstUnfinishedInPhase(pid, completed) || firstChapterId)}
                whileHover={phaseUnlocked ? { y: -3 } : undefined}
                disabled={!phaseUnlocked}
                className="text-left rounded-(--radius) border p-5 flex flex-col gap-3 relative overflow-hidden"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                  boxShadow: "var(--shadow)",
                  cursor: phaseUnlocked ? "pointer" : "not-allowed",
                  opacity: phaseUnlocked ? 1 : 0.6,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: meta.color }} />
                <div className="flex items-center justify-between">
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-none"
                    style={{ background: meta.soft }}
                  >
                    {phaseDone ? "✓" : meta.icon}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
                    {phase.label}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--ink)" }}>{phase.shortLabel}</h3>
                  <p className="text-[13.5px] leading-relaxed mt-1" style={{ color: "var(--ink-soft)" }}>{meta.tagline}</p>
                </div>
                <div className="mt-auto pt-2">
                  {phaseUnlocked ? (
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                      <div className="h-full rounded-full" style={{ width: `${prog.pct}%`, background: meta.color }} />
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--ink-faint)" }}>🔒 Se débloque après la partie précédente</span>
                  )}
                  {phaseUnlocked && (
                    <span className="text-xs mt-1.5 block" style={{ color: "var(--ink-faint)" }}>{prog.done}/{prog.total} exercices</span>
                  )}
                </div>
                <span className="absolute -right-3 -bottom-4 text-[64px] opacity-[0.06] select-none" aria-hidden="true">{i + 1}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function firstUnfinishedInPhase(phaseId: string, completed: Record<string, boolean>): string | null {
  const phase = CURRICULUM[phaseId];
  const found = phase.chapters.find((c: Chapter) => !chapterDone(c, completed));
  return found ? found.id : phase.chapters[phase.chapters.length - 1]?.id || null;
}
