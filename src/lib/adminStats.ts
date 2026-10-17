// Pure aggregations behind the /admin dashboard — no database access here, so they can be
// checked on hand-made data. Input is the shape stored in the MongoDB `progress` collection.
import { flatChapters } from "./progress";
import type { ProgressData } from "./cloud/shape";
import type { Exercise } from "./types";

export type LearnerProgress = Partial<Pick<ProgressData, "completed" | "passAttempts" | "code">>;

export type ExerciseStatus = "passed" | "started" | "todo";

/**
 * Where a learner stands on one exercise. Code is only saved once the learner edits it, so a
 * saved version different from the starter means they worked on it. (Reset → back to the
 * starter → counts as not started again.)
 */
export function exerciseStatus(p: LearnerProgress | null | undefined, ex: Pick<Exercise, "id" | "starter">): ExerciseStatus {
  if (p?.completed?.[ex.id]) return "passed";
  const code = p?.code?.[ex.id];
  return code !== undefined && code !== ex.starter ? "started" : "todo";
}

export type ExerciseStat = {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  phaseLabel: string;
  /** Learners who passed it or worked on it. */
  started: number;
  passed: number;
  /** Worked on it, not passed (yet). */
  stuck: number;
  /** Mean failed "Vérifier" before success, among those who passed — null if nobody passed. */
  avgFailures: number | null;
  /** Passed on the very first "Vérifier". */
  firstTry: number;
};

/** One entry per exercise of the curriculum, in course order. */
export function exerciseStats(learners: LearnerProgress[]): ExerciseStat[] {
  return flatChapters().flatMap(({ phase, chapter }) =>
    chapter.exercises.map((ex) => {
      let started = 0, passed = 0, failuresSum = 0, failuresCount = 0, firstTry = 0;
      for (const p of learners) {
        const status = exerciseStatus(p, ex);
        if (status === "todo") continue;
        started++;
        if (status !== "passed") continue;
        passed++;
        const failures = p.passAttempts?.[ex.id];
        if (typeof failures === "number") {
          failuresSum += failures;
          failuresCount++;
          if (failures === 0) firstTry++;
        }
      }
      return {
        id: ex.id,
        title: ex.title,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        phaseLabel: phase.label,
        started,
        passed,
        stuck: started - passed,
        avgFailures: failuresCount ? failuresSum / failuresCount : null,
        firstTry,
      };
    })
  );
}

/**
 * The exercises where learners struggle most: most learners stuck first, then the most failed
 * attempts before success. Exercises nobody struggled on are left out.
 */
export function hardestExercises(stats: ExerciseStat[], limit = 10): ExerciseStat[] {
  return stats
    .map((s, order) => ({ s, order }))
    .filter(({ s }) => s.stuck > 0 || (s.avgFailures ?? 0) > 0)
    .sort((a, b) =>
      b.s.stuck - a.s.stuck ||
      (b.s.avgFailures ?? 0) - (a.s.avgFailures ?? 0) ||
      a.order - b.order
    )
    .slice(0, limit)
    .map(({ s }) => s);
}
