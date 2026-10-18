"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { findChapterEntry, isChapterUnlocked, langKeyFor, nextChapterAfter, prevChapterBefore, firstUnfinishedChapterId } from "@/lib/progress";
import { highlightCode } from "@/lib/highlight";
import { ExerciseCard } from "./ExerciseCard";
import { Mascot } from "./Mascot";
import { AppLink } from "./AppLink";
import { LoginWall } from "./LoginWall";
import { useLoginGate } from "@/lib/loginGate";

export function ChapterPage({ chapterId }: { chapterId: string }) {
  const completed = useAppStore((s) => s.completed);
  const storySeen = useAppStore((s) => s.storySeen);
  const markStorySeen = useAppStore((s) => s.markStorySeen);
  const goTo = useAppStore((s) => s.goTo);

  const entry = findChapterEntry(chapterId);
  const unlocked = isChapterUnlocked(chapterId, completed);
  const gate = useLoginGate();
  const checkingAccount = gate.checking(chapterId);
  const mustSignIn = gate.mustSignIn(chapterId);
  const blocked = checkingAccount || mustSignIn;
  const [showStory, setShowStory] = useState(false);
  const [exampleOutput, setExampleOutput] = useState<{ lines?: string[]; err?: string } | null>(null);

  useEffect(() => {
    setExampleOutput(null);
    // Only once the chapter is really shown — not behind the sign-in wall.
    if (blocked) return;
    if (entry?.chapter.story && !storySeen[entry.chapter.id]) {
      markStorySeen(entry.chapter.id);
      setShowStory(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, blocked]);

  if (!entry) return null;
  const { chapter, phase } = entry;
  const langKey = langKeyFor(phase.id);

  if (checkingAccount) {
    return (
      <div className="flex justify-center py-24" aria-label="Vérification du compte">
        <Mascot mood="think" size={64} interactive={false} />
      </div>
    );
  }
  if (mustSignIn) return <LoginWall chapterTitle={chapter.title} />;

  if (!unlocked) {
    const targetId = firstUnfinishedChapterId(completed);
    return (
      <div className="flex flex-col items-center text-center max-w-[52ch] mx-auto my-16 px-8 py-9 rounded-(--radius) border" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <Mascot mood="think" size={76} interactive={false} className="mb-2.5" />
        <span className="font-mono text-xs uppercase tracking-wide mb-2.5" style={{ color: "var(--ink-faint)" }}>🔒 Chapitre verrouillé</span>
        <h2 className="text-xl mb-2.5">{chapter.title}, pas encore</h2>
        <p className="text-[14.5px] leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }}>Le parcours se suit dans l&apos;ordre, comme l&apos;histoire de CaMI.</p>
        <button className="btn-primary" onClick={() => goTo(targetId)}>Continuer le parcours →</button>
      </div>
    );
  }

  const prev = prevChapterBefore(chapter.id);
  const next = nextChapterAfter(chapter.id);

  function runExample() {
    const res = phase.run(chapter.example.code);
    if (res.success) setExampleOutput({ lines: res.output.length ? res.output : ["(pas de sortie)"] });
    else setExampleOutput({ err: (res.error?.line ? `Ligne ${res.error.line} — ` : "") + res.error?.message });
  }

  return (
    <div>
      <AnimatePresence>
        {showStory && chapter.story && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-5"
            style={{ background: "rgba(20,18,28,0.45)" }}
            onClick={() => setShowStory(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-2xl border p-7 max-w-[440px] w-full text-center"
              style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-2.5"><Mascot mood="happy" size={80} interactive={false} /></div>
              <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>L&apos;histoire continue</span>
              <div className="text-left text-[14.5px] leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: chapter.story }} />
              <button className="btn-primary btn-sm" onClick={() => setShowStory(false)}>C&apos;est parti</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 mb-7 text-[13px]" style={{ color: "var(--ink-faint)" }}>
        <span>{phase.label} · <b style={{ color: "var(--ink-soft)", fontWeight: 600 }}>{chapter.title}</b></span>
      </div>

      <span className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>{phase.langTag}</span>
      <h1 className="text-[clamp(26px,3.4vw,34px)] mt-2 mb-5">{chapter.title}</h1>

      {chapter.story && (
        <div className="flex gap-3.5 items-start rounded-(--radius) border px-5 py-4 mb-7 max-w-[66ch]" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
          <Mascot mood="idle" size={44} interactive={false} className="flex-none mt-0.5" />
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>L&apos;histoire continue</span>
            <div className="text-[14.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: chapter.story }} />
          </div>
        </div>
      )}

      <div className="max-w-[66ch] text-[16.5px] leading-relaxed mt-5" style={{ color: "var(--ink-soft)" }}>
        {chapter.intro.map((p, i) => (
          <p key={i} className="mb-3.5" style={{ color: i === 0 ? "var(--ink-soft)" : undefined }} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </div>

      {chapter.callout && (
        <div className="border-l-[3px] rounded-r-[10px] px-4 py-3.5 my-5 max-w-[64ch] text-[14.5px] leading-relaxed" style={{ borderColor: "var(--accent)", background: "var(--paper)", borderTop: "1px solid var(--line)", borderRight: "1px solid var(--line)", borderBottom: "1px solid var(--line)", color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: chapter.callout }} />
      )}

      <div className="rounded-(--radius) overflow-hidden border mt-6 mb-7" style={{ borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
          <span className="font-mono text-[11.5px] uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Exemple</span>
          <button className="btn-ghost btn-sm" onClick={runExample}>▷ Exécuter l&apos;exemple</button>
        </div>
        <pre
          className="m-0 font-mono text-sm leading-relaxed px-5 py-4 overflow-x-auto whitespace-pre"
          style={{ background: "var(--editor-bg)", color: "var(--editor-ink)" }}
          dangerouslySetInnerHTML={{ __html: highlightCode(chapter.example.code, langKey) }}
        />
        {exampleOutput && (
          <div className="px-5 py-3.5 font-mono text-[13.5px] border-t border-dashed" style={{ background: "var(--editor-bg)", borderColor: "var(--editor-line)", color: "var(--editor-ink-soft)" }}>
            {exampleOutput.err
              ? <div style={{ color: "#F2917F" }}>{exampleOutput.err}</div>
              : exampleOutput.lines!.map((l, i) => <div key={i} style={{ color: "var(--editor-ink)" }} className="py-px">{l}</div>)}
          </div>
        )}
      </div>

      <div className="text-xs uppercase tracking-wide font-bold my-9" style={{ color: "var(--ink-faint)" }}>Exercices</div>
      {chapter.exercises.map((ex, i) => (
        <ExerciseCard key={ex.id} ex={ex} index={i} chapter={chapter} phase={phase} langKey={langKey} />
      ))}

      <div className="flex justify-between items-center mt-8 pt-6 border-t" style={{ borderColor: "var(--line)" }}>
        {prev ? <AppLink to={prev.id} className="btn-ghost">← {prev.title}</AppLink> : <span />}
        {next ? (
          <AppLink to={next.id} className="btn-primary">
            {findChapterEntry(next.id)?.phase.id !== phase.id ? `Direction : ${findChapterEntry(next.id)?.phase.shortLabel}` : "Chapitre suivant"} →
          </AppLink>
        ) : (
          <span className="text-[13px]" style={{ color: "var(--ink-faint)" }}>🎉 Tu as atteint la fin du parcours — bravo !</span>
        )}
      </div>
    </div>
  );
}
