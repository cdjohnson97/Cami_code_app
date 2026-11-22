"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter, Exercise, Phase } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { CodeEditor } from "./CodeEditor";
import { highlightCode } from "@/lib/highlight";

export function ExerciseCard({
  ex,
  index,
  chapter,
  phase,
  langKey,
}: {
  ex: Exercise;
  index: number;
  chapter: Chapter;
  phase: Phase;
  langKey: string;
}) {
  const completed = useAppStore((s) => s.completed[ex.id]);
  const usedSolution = useAppStore((s) => s.usedSolution[ex.id]);
  const usedPaste = useAppStore((s) => s.usedPaste[ex.id]);
  const failedCount = useAppStore((s) => s.failedAttempts[ex.id] || 0);
  const savedCode = useAppStore((s) => s.code[ex.id]);
  const saveCode = useAppStore((s) => s.saveCode);
  const registerAttempt = useAppStore((s) => s.registerAttempt);
  const recordFailedAttempt = useAppStore((s) => s.recordFailedAttempt);
  const recordUsedSolution = useAppStore((s) => s.recordUsedSolution);
  const recordUsedPaste = useAppStore((s) => s.recordUsedPaste);
  const clearUsedPaste = useAppStore((s) => s.clearUsedPaste);
  const retryExercise = useAppStore((s) => s.retryExercise);
  const completeExercise = useAppStore((s) => s.completeExercise);

  const [code, setCode] = useState(savedCode ?? ex.starter);
  const [consoleLines, setConsoleLines] = useState<string[] | null>(null);
  const [consoleErr, setConsoleErr] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(usedSolution ?? false);
  const [confirmingSolution, setConfirmingSolution] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [altShown, setAltShown] = useState(false);

  function updateCode(v: string) {
    setCode(v);
    saveCode(ex.id, v);
  }

  function handleRun() {
    const res = phase.run(code);
    if (res.success) {
      setConsoleLines(res.output.length ? res.output : ["(pas de sortie — ajoute un affichage pour voir un résultat)"]);
      setConsoleErr(null);
    } else {
      setConsoleLines(null);
      setConsoleErr((res.error?.line ? `Ligne ${res.error.line} — ` : "") + (res.error?.message || "Erreur inconnue."));
    }
  }

  function handleCheck() {
    registerAttempt(ex.id);
    const res = phase.run(code);
    const verdict = ex.checker(res, code);
    setFeedback({ ok: verdict.pass, message: verdict.message });
    if (verdict.pass) {
      completeExercise(ex.id, chapter.id);
    } else {
      recordFailedAttempt(ex.id);
    }
    if (res.success) {
      setConsoleLines(res.output);
      setConsoleErr(null);
    } else {
      setConsoleLines(null);
      setConsoleErr((res.error?.line ? `Ligne ${res.error.line} — ` : "") + (res.error?.message || "Erreur inconnue."));
    }
  }

  function handleReset() {
    updateCode(ex.starter);
    setFeedback(null);
    setConsoleLines(null);
    setConsoleErr(null);
  }

  function handleRetryAutonomous() {
    retryExercise(ex.id, ex.starter);
    setCode(ex.starter);
    setFeedback(null);
    setConsoleLines(null);
    setConsoleErr(null);
    setSolutionOpen(false);
    setConfirmingSolution(false);
    setPasteWarning(false);
    setRevealedHints(0);
  }

  function handlePasteCode() {
    recordUsedPaste(ex.id);
    setPasteWarning(true);
  }

  const isWithAid = !!(usedSolution || usedPaste);
  const highlightedSolution = useMemo(() => highlightCode(ex.solution, langKey), [ex.solution, langKey]);

  return (
    <div
      className="rounded-(--radius) border mb-6 overflow-hidden"
      style={{ borderColor: "var(--line)", background: "var(--paper)", boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-start gap-3 px-5 pt-4 pb-1">
        <motion.div
          key={completed ? (usedSolution ? "done-sol" : usedPaste ? "done-paste" : "done-pure") : "todo"}
          initial={completed ? { scale: 0.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="flex-none w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12.5px] mt-0.5"
          style={
            completed
              ? isWithAid
                ? { background: "var(--warn)", borderColor: "var(--warn)", color: "var(--warn-ink)" }
                : { background: "var(--success)", borderColor: "var(--success)", color: "var(--paper)" }
              : { borderColor: "var(--line-strong)", color: "var(--ink-faint)" }
          }
        >
          {completed ? (usedSolution ? "💡" : usedPaste ? "📋" : "✓") : index + 1}
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h4 className="font-body text-[16.5px] font-bold m-0" style={{ color: "var(--ink)" }}>{ex.title}</h4>
            {completed && (
              <span
                className="font-mono text-[10.5px] uppercase tracking-wider px-2 py-0.5 rounded-[5px]"
                style={
                  isWithAid
                    ? { background: "var(--warn-soft)", color: "var(--warn-ink)" }
                    : { background: "var(--success-soft)", color: "var(--success)" }
                }
              >
                {usedSolution ? "Validé avec solution" : usedPaste ? "Validé (code collé)" : "Validé en autonomie"}
              </span>
            )}
          </div>
          <div
            className="exercise-instr text-[14.5px] max-w-[62ch]"
            style={{ color: "var(--ink-soft)" }}
            dangerouslySetInnerHTML={{ __html: ex.instr }}
          />
        </div>
      </div>

      {completed && isWithAid && (
        <div
          className="mx-5 mt-3 rounded-[9px] border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap text-[13px]"
          style={{ background: "var(--warn-soft)", borderColor: "var(--line)", color: "var(--warn-ink)" }}
        >
          <span>
            {usedSolution
              ? "Cet exercice a été validé avec la solution. Tu peux le refaire seul·e pour obtenir la pastille verte 100% autonome !"
              : "Cet exercice a été validé avec un bloc de code collé. Tu peux le refaire en tapant le code toi-même pour obtenir la pastille verte 100% autonome !"}
          </span>
          <button
            className="btn-ghost btn-sm"
            style={{ borderColor: "var(--line)", background: "var(--paper)" }}
            onClick={handleRetryAutonomous}
          >
            ↺ Réessayer en autonomie
          </button>
        </div>
      )}

      <div className="mt-3.5 mx-5">
        <CodeEditor value={code} onChange={updateCode} lang={langKey} onPasteCode={handlePasteCode} />
      </div>

      {pasteWarning && !completed && (
        <div
          className="mx-5 mt-3 rounded-[10px] p-4 border"
          style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "var(--warn-ink)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5">📋</span>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold mb-1">
                Bloc de code collé détecté
              </p>
              <p className="text-[13px] leading-relaxed mb-3">
                Retaper le code au clavier est essentiel pour mémoriser la syntaxe et la logique.
                Si tu valides avec ce code, l&apos;exercice sera enregistré avec la mention <strong>« Code collé »</strong> et les badges de réussite autonome (ex. <em>Sans faute</em>) ne seront pas accordés.
              </p>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => {
                    updateCode(ex.starter);
                    clearUsedPaste(ex.id);
                    setPasteWarning(false);
                    setFeedback(null);
                  }}
                >
                  ↺ Effacer et retaper moi-même
                </button>
                <button
                  className="btn-ghost btn-sm"
                  style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                  onClick={() => setPasteWarning(false)}
                >
                  Garder ce code (mention &quot;Code collé&quot;)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5 px-5 pt-3 pb-4 flex-wrap">
        <button onClick={handleCheck} className="btn-primary">Vérifier</button>
        <button onClick={handleRun} className="btn-ghost">▷ Exécuter</button>
        <div className="flex-1" />
        <button onClick={handleReset} className="btn-ghost">↺ Réinitialiser</button>
      </div>

      {(consoleLines || consoleErr) && (
        <div
          className="mx-5 mb-4 rounded-[10px] border font-mono text-[13px] px-3.5 py-2.5"
          style={{ background: "var(--editor-bg)", borderColor: "var(--editor-line)", color: "var(--editor-ink-soft)" }}
        >
          {consoleErr ? (
            <div style={{ color: "#F2917F" }}>{consoleErr}</div>
          ) : (
            consoleLines!.map((l, i) => (
              <div key={i} style={{ color: "var(--editor-ink)" }} className="whitespace-pre-wrap py-px">{l}</div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-5 mb-4 rounded-[10px] px-4 py-3 text-sm flex items-start gap-2"
            style={
              feedback.ok
                ? { background: "var(--success-soft)", color: "var(--success-ink)" }
                : { background: "var(--warn-soft)", color: "var(--warn-ink)" }
            }
          >
            <span>{feedback.ok ? "✓" : "✳"}</span>
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!feedback?.ok && !completed && (
        <div className="mx-5 mb-4 flex flex-col gap-2.5">
          {/* Indices progressifs */}
          {ex.hints.slice(0, revealedHints).map((hintText, i) => (
            <div
              key={i}
              className="rounded-[9px] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
              style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}
            >
              <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-1 opacity-80">
                Indice {i + 1} sur {ex.hints.length}
              </span>
              {hintText}
            </div>
          ))}

          {/* Bouton pour afficher l'indice suivant */}
          {revealedHints < ex.hints.length && (
            <button
              className="btn-ghost btn-sm self-start"
              onClick={() => setRevealedHints((n) => n + 1)}
            >
              💡 {revealedHints === 0 ? "Voir un indice" : `Voir l'indice suivant (${revealedHints + 1}/${ex.hints.length})`}
            </button>
          )}

          {/* Solution : disponible uniquement quand tous les indices sont consultés */}
          {revealedHints >= ex.hints.length && (
            <div className="mt-1">
              {!solutionOpen ? (
                failedCount < 2 ? (
                  <div
                    className="rounded-[9px] px-3.5 py-2.5 text-[13px] border flex items-center gap-2.5"
                    style={{ borderColor: "var(--line)", background: "var(--paper)", color: "var(--ink-soft)" }}
                  >
                    <span className="text-base">🔒</span>
                    <div>
                      <strong>Solution verrouillée</strong> : fais encore au moins{" "}
                      <strong>{2 - failedCount} tentative{2 - failedCount > 1 ? "s" : ""}</strong> avec le bouton
                      « Vérifier » pour la débloquer si tu es bloqué·e ({failedCount}/2).
                    </div>
                  </div>
                ) : confirmingSolution ? (
                  <div
                    className="rounded-[10px] p-4 border"
                    style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "var(--warn-ink)" }}
                  >
                    <p className="text-[13.5px] font-bold mb-1.5">
                      ⚠️ Débloquer la solution ?
                    </p>
                    <p className="text-[13px] leading-relaxed mb-3">
                      Consulter la solution marquera cet exercice comme <strong>« Résolu avec aide »</strong>.
                      Il n&apos;attribuera pas les badges d&apos;excellence autonome (ex. <em>Sans faute</em>), et tu devras saisir toi-même le code dans l&apos;éditeur.
                    </p>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => {
                          recordUsedSolution(ex.id);
                          setSolutionOpen(true);
                          setConfirmingSolution(false);
                        }}
                      >
                        Afficher la solution
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => setConfirmingSolution(false)}
                      >
                        Annuler (continuer à chercher)
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-ghost btn-sm self-start"
                    style={{ color: "var(--warn-ink)" }}
                    onClick={() => setConfirmingSolution(true)}
                  >
                    🔓 Voir la solution (après 2 essais)
                  </button>
                )
              ) : (
                <div className="rounded-[10px] px-4 py-3.5" style={{ background: "var(--editor-bg)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--warn)" }}>
                      Solution de référence (avec aide)
                    </span>
                  </div>
                  <pre
                    className="font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto m-0 mb-2.5"
                    style={{ color: "var(--editor-ink)" }}
                    dangerouslySetInnerHTML={{ __html: highlightedSolution }}
                  />
                  <p className="text-[12px] leading-relaxed m-0" style={{ color: "var(--editor-ink-soft)" }}>
                    ✍️ <em>Lis et comprends cette solution, puis écris-la toi-même dans l&apos;éditeur ci-dessus pour la tester et valider l&apos;exercice.</em>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {completed && (
        <div className="mx-5 mb-4 flex flex-col gap-2.5">
          {!solutionOpen ? (
            <button
              className="btn-ghost btn-sm self-start"
              onClick={() => setSolutionOpen(true)}
            >
              👁️ Revoir la solution de référence
            </button>
          ) : (
            <div className="rounded-[10px] px-4 py-3.5" style={{ background: "var(--editor-bg)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--editor-ink-soft)" }}>
                  Solution de référence
                </span>
                <button
                  className="text-xs px-2 py-0.5 rounded hover:opacity-75"
                  style={{ color: "var(--editor-ink-soft)" }}
                  onClick={() => setSolutionOpen(false)}
                >
                  Masquer ✕
                </button>
              </div>
              <pre
                className="font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto m-0"
                style={{ color: "var(--editor-ink)" }}
                dangerouslySetInnerHTML={{ __html: highlightedSolution }}
              />
            </div>
          )}
        </div>
      )}

      {completed && ex.alternatives && ex.alternatives.length > 0 && (
        <div className="mx-5 mb-5 flex flex-col gap-2.5">
          {!altShown ? (
            <button className="btn-ghost btn-sm self-start" onClick={() => setAltShown(true)}>🔀 Voir d&apos;autres façons de faire</button>
          ) : (
            ex.alternatives.map((a, i) => (
              <div key={i} className="rounded-[10px] px-4 py-3.5" style={{ background: "var(--editor-bg)" }}>
                <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-2" style={{ color: "var(--success)" }}>{a.label}</span>
                <pre
                  className="font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto m-0 mb-2.5"
                  style={{ color: "var(--editor-ink)" }}
                  dangerouslySetInnerHTML={{ __html: highlightCode(a.code, langKey) }}
                />
                <p className="text-[12.5px] leading-relaxed m-0" style={{ color: "var(--editor-ink-soft)" }}>{a.note}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
