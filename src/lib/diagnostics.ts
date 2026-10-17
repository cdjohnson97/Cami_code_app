import { runPseudo, runPython } from "./algoEngine";

// Live error checking while the learner types. There's no separate static analyser: the code is
// simply run through the real interpreter (pure, synchronous, no I/O — prints only go to an
// array), so the message is exactly the one "Exécuter" would show, syntax and runtime alike.

export type Diagnostic = { line: number | null; message: string };

// Far below the interpreter's default 200 000 so a keystroke never costs more than a few ms.
const LIVE_MAX_STEPS = 20_000;

export function diagnose(code: string, lang: string): Diagnostic | null {
  if (!code.trim()) return null;
  const run = lang === "python" ? runPython : runPseudo;
  const res = run(code, { maxSteps: LIVE_MAX_STEPS });
  if (res.success || !res.error) return null;

  const { message, line } = res.error;
  // Hitting the reduced live budget doesn't mean the program is wrong — "Exécuter" will tell.
  if (message.startsWith("Le programme met trop de temps")) return null;
  // Non-RTError exceptions from the engine on half-typed code: not a message for a learner.
  if (message.startsWith("Erreur interne") || message.startsWith("Erreur :")) return null;
  return { line, message };
}
