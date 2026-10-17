import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { collections } from "@/lib/cloud/mongo";
import { exerciseStatus, type ExerciseStatus } from "@/lib/adminStats";
import { highlightCode } from "@/lib/highlight";
import { completedCount, flatChapters, langKeyFor, totalExerciseCount } from "@/lib/progress";
import { PHASE_ORDER, CURRICULUM } from "@/lib/curriculum";
import type { Chapter } from "@/lib/types";
import { checkAdminAccess } from "../../access";
import { Message, ProgressBar, Shell, formatDate } from "../../ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const STATUS: Record<ExerciseStatus, { icon: string; label: string; color: string }> = {
  passed: { icon: "✓", label: "Réussi", color: "var(--success)" },
  started: { icon: "✎", label: "Commencé, pas réussi", color: "var(--warn)" },
  todo: { icon: "○", label: "Pas commencé", color: "var(--ink-faint)" },
};

async function loadLearner(id: ObjectId) {
  const { users, progress, preferences } = collections();
  const [user, prog, prefs] = await Promise.all([
    users.findOne({ _id: id }, { projection: { name: 1, email: 1, role: 1 } }),
    progress.findOne({ _id: id }),
    preferences.findOne({ _id: id }, { projection: { name: 1 } }),
  ]);
  return user ? { user, prog, prefs } : null;
}

export default async function LearnerPage({ params }: Props) {
  const access = await checkAdminAccess();
  if (!access.ok) {
    return (
      <Shell>
        <Message text={access.message} />
      </Shell>
    );
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  const data = await loadLearner(new ObjectId(id)).catch(() => "unreachable" as const);
  if (data === "unreachable") {
    return (
      <Shell back>
        <Message text="Impossible de joindre MongoDB pour le moment." />
      </Shell>
    );
  }
  if (!data) notFound();

  const { user, prog, prefs } = data;
  const total = totalExerciseCount();
  const done = completedCount(prog?.completed || {});
  const pct = total ? Math.round((done / total) * 100) : 0;
  const name = prefs?.name || user.name || "(sans nom)";
  const stuckCount = flatChapters().reduce(
    (n, { chapter }) => n + chapter.exercises.filter((ex) => exerciseStatus(prog, ex) === "started").length,
    0
  );

  return (
    <Shell back>
      <h1 className="text-2xl mb-1">{name}</h1>
      <p className="text-[14.5px] mb-5" style={{ color: "var(--ink-soft)" }}>
        {user.email || "—"} · rôle <span className="font-mono text-[12.5px]">{user.role ?? "student"}</span> · inscrit·e le{" "}
        {formatDate(user._id.getTimestamp())}
      </p>

      <div className="flex flex-wrap gap-x-8 gap-y-3 items-center rounded-(--radius) border px-5 py-4 mb-9 text-[13.5px]" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <div><ProgressBar pct={pct} /></div>
        <div style={{ color: "var(--ink-soft)" }}><b style={{ color: "var(--ink)" }}>{done}</b>/{total} exercices réussis</div>
        <div style={{ color: stuckCount ? "var(--warn)" : "var(--ink-soft)" }}><b>{stuckCount}</b> commencé{stuckCount > 1 ? "s" : ""} sans être réussi{stuckCount > 1 ? "s" : ""}</div>
        <div style={{ color: "var(--ink-soft)" }}>🔥 {prog?.streak ?? 0} jour{(prog?.streak ?? 0) > 1 ? "s" : ""} (record {prog?.bestStreak ?? 0})</div>
        <div style={{ color: "var(--ink-faint)" }}>Dernière activité : {formatDate(prog?.updatedAt)}</div>
      </div>

      {PHASE_ORDER.map((pid: string) => {
        const phase = CURRICULUM[pid];
        const lang = langKeyFor(pid);
        return (
          <section key={pid} className="mb-9">
            <h2 className="text-lg mb-3">{phase.label} · {phase.shortLabel}</h2>
            <div className="flex flex-col gap-3">
              {phase.chapters.map((chapter: Chapter) => {
                const statuses = chapter.exercises.map((ex) => exerciseStatus(prog, ex));
                const passed = statuses.filter((s) => s === "passed").length;
                const untouched = statuses.every((s) => s === "todo");
                return (
                  <div key={chapter.id} className="rounded-(--radius) border" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
                    <div className="flex justify-between gap-3 px-4 py-3 text-[14px]">
                      <span className="font-semibold">{chapter.title}</span>
                      <span style={{ color: untouched ? "var(--ink-faint)" : "var(--ink-soft)" }}>
                        {untouched ? "Pas encore commencé" : `${passed}/${chapter.exercises.length}`}
                      </span>
                    </div>
                    {!untouched && (
                      <ul className="m-0 p-0 list-none border-t" style={{ borderColor: "var(--line)" }}>
                        {chapter.exercises.map((ex, i) => {
                          const status = statuses[i];
                          const st = STATUS[status];
                          const failures = prog?.passAttempts?.[ex.id];
                          const code = prog?.code?.[ex.id];
                          return (
                            <li key={ex.id} className="px-4 py-2.5 border-t first:border-t-0 text-[13.5px]" style={{ borderColor: "var(--line)" }}>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span aria-label={st.label} title={st.label} className="w-4 text-center font-bold" style={{ color: st.color }}>{st.icon}</span>
                                <span style={{ color: status === "todo" ? "var(--ink-faint)" : "var(--ink)" }}>{ex.title}</span>
                                <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                                  {status === "passed"
                                    ? typeof failures === "number"
                                      ? failures === 0 ? "réussi du premier coup" : `réussi après ${failures} essai${failures > 1 ? "s" : ""} raté${failures > 1 ? "s" : ""}`
                                      : "réussi"
                                    : status === "started" ? "en cours" : ""}
                                </span>
                              </div>
                              {status !== "todo" && code !== undefined && code !== ex.starter && (
                                <details className="mt-2 ml-6">
                                  <summary className="cursor-pointer text-xs" style={{ color: "var(--accent)" }}>Voir son code</summary>
                                  {/* highlightCode escapes the learner's code (&, <, >) — safe to inject. */}
                                  <pre
                                    className="mt-2 m-0 font-mono text-[12.5px] leading-relaxed px-4 py-3 rounded-[9px] overflow-x-auto whitespace-pre"
                                    style={{ background: "var(--editor-bg)", color: "var(--editor-ink)" }}
                                    dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }}
                                  />
                                </details>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </Shell>
  );
}
