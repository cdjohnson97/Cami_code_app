// Shared types for the CaMI app. The curriculum content itself (CURRICULUM, exercises, checkers)
// stays loosely typed (see curriculum.ts) since it's ported verbatim from tested JS — these types
// describe its *shape* for everything downstream (store, components) without constraining it.

export type CheckResult = { pass: boolean; message: string };

export type EngineResult = {
  success: boolean;
  output: string[];
  globals: Record<string, unknown>;
  error: { message: string; line: number | null } | null;
  trace?: unknown[];
};

export type Exercise = {
  id: string;
  title: string;
  instr: string;
  starter: string;
  hints: string[];
  solution: string;
  checker: (result: EngineResult, studentCode: string) => CheckResult;
  alternatives?: { label: string; code: string; note: string }[];
};

export type Chapter = {
  id: string;
  title: string;
  story?: string;
  teaser?: string;
  intro: string[];
  callout?: string;
  example: { code: string };
  exercises: Exercise[];
};

export type Phase = {
  id: string;
  label: string;
  shortLabel: string;
  langTag: string;
  run: (src: string) => EngineResult;
  chapters: Chapter[];
};

export type Curriculum = Record<string, Phase>;

export type Badge = {
  id: string;
  icon: string;
  /** Inclusive title ("Persévérant·e"); see badgeTitle() for the gendered forms. */
  title: string;
  titles?: { m: string; f: string };
  desc: string;
  check: (ctx: BadgeCheckContext) => boolean;
};

export type BadgeCheckContext = {
  completed: Record<string, boolean>;
  passAttempts: Record<string, number>;
  streak: number;
};

export type GlossaryEntry = {
  id: string;
  term: string;
  tag: string;
  def: string;
  example?: Record<string, string>;
};

export type MascotMood = "idle" | "happy" | "wink" | "celebrate" | "think" | "wave";

/** How the app addresses the learner: "f" féminin, "m" masculin, null = inclusive forms (prêt·e). */
export type Gender = "f" | "m" | null;

export type AppState = {
  name: string | null;
  gender: Gender;
  nameAsked: boolean;
  completed: Record<string, boolean>;
  code: Record<string, string>;
  passAttempts: Record<string, number>;
  earnedBadges: Record<string, boolean>;
  streak: number;
  bestStreak: number;
  lastVisitDay: string | null;
  storySeen: Record<string, boolean>;
  theme: "auto" | "light" | "dark";
  sandboxCode: Record<string, string>;
  sandboxLang: "pseudo" | "python";
  soundOn: boolean;
  completionDate: string | null;
};
