// Pure progress-tracking helpers — hand-ported (not extracted) from the original app's
// closure-over-a-global-`state` versions into explicit, testable functions that take the
// relevant state as an argument. Small and easy to verify by inspection.
import { CURRICULUM, PHASE_ORDER } from "./curriculum";
import type { Badge, BadgeCheckContext, Chapter, Phase } from "./types";

export type FlatEntry = { phase: Phase; chapter: Chapter; indexInPhase: number };

export function flatChapters(): FlatEntry[] {
  const list: FlatEntry[] = [];
  PHASE_ORDER.forEach((pid: string) => {
    const phase = CURRICULUM[pid];
    phase.chapters.forEach((ch: Chapter, idx: number) => list.push({ phase, chapter: ch, indexInPhase: idx }));
  });
  return list;
}

export function findChapterEntry(id: string): FlatEntry | undefined {
  return flatChapters().find((x) => x.chapter.id === id);
}

export function totalExerciseCount(): number {
  return flatChapters().reduce((n, x) => n + x.chapter.exercises.length, 0);
}

export function completedCount(completed: Record<string, boolean>): number {
  let n = 0;
  flatChapters().forEach((x) => x.chapter.exercises.forEach((ex) => { if (completed[ex.id]) n++; }));
  return n;
}

export function chapterDone(chapter: Chapter, completed: Record<string, boolean>): boolean {
  return chapter.exercises.every((ex) => completed[ex.id]);
}

export function langKeyFor(phaseId: string): "pseudo" | "python" {
  return phaseId === "algo" ? "pseudo" : "python";
}

export function firstUnfinishedChapterId(completed: Record<string, boolean>): string {
  const flat = flatChapters();
  const found = flat.find((x) => !chapterDone(x.chapter, completed));
  return found ? found.chapter.id : flat[0].chapter.id;
}

export function isLastChapterOfPhase(phase: Phase, chapter: Chapter): boolean {
  return phase.chapters[phase.chapters.length - 1].id === chapter.id;
}

export function isChapterUnlocked(chapterId: string, completed: Record<string, boolean>): boolean {
  const flat = flatChapters();
  const idx = flat.findIndex((x) => x.chapter.id === chapterId);
  if (idx <= 0) return true; // unknown id, or the very first chapter — never locked
  return chapterDone(flat[idx - 1].chapter, completed);
}

export function nextChapterAfter(chapterId: string): Chapter | null {
  const flat = flatChapters();
  const idx = flat.findIndex((x) => x.chapter.id === chapterId);
  return idx >= 0 && flat[idx + 1] ? flat[idx + 1].chapter : null;
}

export function prevChapterBefore(chapterId: string): Chapter | null {
  const flat = flatChapters();
  const idx = flat.findIndex((x) => x.chapter.id === chapterId);
  return idx > 0 ? flat[idx - 1].chapter : null;
}

export function phaseProgress(phase: Phase, completed: Record<string, boolean>) {
  const total = phase.chapters.reduce((n, c) => n + c.exercises.length, 0);
  const done = phase.chapters.reduce((n, c) => n + c.exercises.filter((ex) => completed[ex.id]).length, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// -- Badges ----------------------------------------------------------------
// Hand-ported from the original BADGES array: the `check` functions there closed over a global
// mutable `state` object plus a handful of bare helper calls (completedCount(), flatChapters()...).
// Here they take an explicit BadgeCheckContext instead — same conditions, just passed in rather
// than reached for via a global.
export const BADGES: Badge[] = [
  { id: "premier-pas", icon: "🌱", title: "Premier pas", desc: "Réussir ton tout premier exercice.",
    check: (ctx) => completedCount(ctx.completed) >= 1 },
  { id: "sans-faute", icon: "🎯", title: "Sans faute", desc: "Réussir un exercice du tout premier coup.",
    check: (ctx) => Object.values(ctx.passAttempts).some((a) => a === 0) },
  { id: "perseverant", icon: "💪", title: "Persévérant·e", desc: "Réussir un exercice après plusieurs essais, sans lâcher.",
    check: (ctx) => Object.values(ctx.passAttempts).some((a) => a >= 3) },
  { id: "premier-chapitre", icon: "📘", title: "Premier chapitre", desc: "Terminer un chapitre entier.",
    check: (ctx) => flatChapters().some((x) => chapterDone(x.chapter, ctx.completed)) },
  { id: "mi-parcours", icon: "🌗", title: "Mi-parcours", desc: "Passer la moitié du parcours CaMI.",
    check: (ctx) => completedCount(ctx.completed) >= Math.ceil(totalExerciseCount() / 2) },
  { id: "algo-maitrise", icon: "🧠", title: "Logique maîtrisée", desc: "Terminer toute la partie Algo.",
    check: (ctx) => CURRICULUM.algo.chapters.every((c: Chapter) => chapterDone(c, ctx.completed)) },
  { id: "pythoniste", icon: "🐍", title: "Pythoniste", desc: "Terminer toute la partie Python.",
    check: (ctx) => CURRICULUM.python.chapters.every((c: Chapter) => chapterDone(c, ctx.completed)) },
  { id: "avance-maitrise", icon: "🧩", title: "Python avancé", desc: "Terminer toute la partie Python avancé.",
    check: (ctx) => CURRICULUM.avance.chapters.every((c: Chapter) => chapterDone(c, ctx.completed)) },
  { id: "ia-explorer", icon: "🤖", title: "Explorateur·rice IA", desc: "Terminer toute la partie Intelligence artificielle.",
    check: (ctx) => CURRICULUM.ia.chapters.every((c: Chapter) => chapterDone(c, ctx.completed)) },
  { id: "parcours-complet", icon: "🏆", title: "Parcours complet", desc: `Terminer les ${totalExerciseCount()} exercices de CaMI.`,
    check: (ctx) => completedCount(ctx.completed) >= totalExerciseCount() },
  { id: "streak-3", icon: "🔥", title: "3 jours de suite", desc: "Revenir 3 jours d'affilée.",
    check: (ctx) => ctx.streak >= 3 },
  { id: "streak-7", icon: "⚡", title: "Une semaine de suite", desc: "Revenir 7 jours d'affilée.",
    check: (ctx) => ctx.streak >= 7 },
];

export function evaluateBadges(ctx: BadgeCheckContext, earnedBadges: Record<string, boolean>): Badge[] {
  const newlyEarned: Badge[] = [];
  BADGES.forEach((b) => {
    if (!earnedBadges[b.id] && b.check(ctx)) newlyEarned.push(b);
  });
  return newlyEarned;
}
