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
  const savedCode = useAppStore((s) => s.code[ex.id]);
  const saveCode = useAppStore((s) => s.saveCode);
  const registerAttempt = useAppStore((s) => s.registerAttempt);
  const completeExercise = useAppStore((s) => s.completeExercise);

  const [code, setCode] = useState(savedCode ?? ex.starter);
  const [consoleLines, setConsoleLines] = useState<string[] | null>(null);
  const [consoleErr, setConsoleErr] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
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

  const highlightedSolution = useMemo(() => highlightCode(ex.solution, langKey), [ex.solution, langKey]);

  return (
    <div
      className="rounded-(--radius) border mb-6 overflow-hidden"
      style={{ borderColor: "var(--line)", background: "var(--paper)", boxShadow: "var(--shadow)" }}
    >
      <div className="flex items-start gap-3 px-5 pt-4 pb-1">
        <motion.div
          key={completed ? "done" : "todo"}
          initial={completed ? { scale: 0.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="flex-none w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12.5px] mt-0.5"
          style={
            completed
              ? { background: "var(--success)", borderColor: "var(--success)", color: "var(--paper)" }
              : { borderColor: "var(--line-strong)", color: "var(--ink-faint)" }
          }
        >
          {completed ? "✓" : index + 1}
        </motion.div>
        <div>
          <h4 className="font-body text-[16.5px] font-bold mb-1" style={{ color: "var(--ink)" }}>{ex.title}</h4>
          <div
            className="exercise-instr text-[14.5px] max-w-[62ch]"
            style={{ color: "var(--ink-soft)" }}
            dangerouslySetInnerHTML={{ __html: ex.instr }}
          />
        </div>
      </div>

      <div className="mt-3.5 mx-5">
        <CodeEditor value={code} onChange={updateCode} lang={langKey} />
      </div>

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

      {!feedback?.ok && (
        <div className="mx-5 mb-4 flex flex-col gap-2.5">
          {Array.from({ length: hintIndex }, (_, i) => (
            <div key={i}>
              {i === 0 ? (
                <div className="rounded-[9px] px-3.5 py-2.5 text-[13.5px] leading-relaxed" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}>
                  <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-1 opacity-80">Indice</span>
                  {ex.hints[0]}
                </div>
              ) : (
                <div className="rounded-[10px] px-4 py-3.5" style={{ background: "var(--editor-bg)" }}>
                  <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-2" style={{ color: "var(--editor-ink-soft)" }}>Solution</span>
                  <pre
                    className="font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto m-0 mb-2.5"
                    style={{ color: "var(--editor-ink)" }}
                    dangerouslySetInnerHTML={{ __html: highlightedSolution }}
                  />
                  <button className="btn-ghost btn-sm" onClick={() => updateCode(ex.solution)}>Charger dans l&apos;éditeur</button>
                </div>
              )}
            </div>
          ))}
          {hintIndex < ex.hints.length && (
            <button className="btn-ghost btn-sm self-start" onClick={() => setHintIndex((n) => n + 1)}>
              💡 {hintIndex === 0 ? "Voir un indice" : "Voir la solution"}
            </button>
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
