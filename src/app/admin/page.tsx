import Link from "next/link";
import { collections } from "@/lib/cloud/mongo";
import { totalExerciseCount, completedCount } from "@/lib/progress";
import { exerciseStats, hardestExercises } from "@/lib/adminStats";
import { checkAdminAccess } from "./access";
import { Card, HeadRow, Message, ProgressBar, Shell, formatAvg, formatDate } from "./ui";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const { users, progress, preferences } = collections();
  const [userDocs, progressDocs, preferenceDocs] = await Promise.all([
    // An ObjectId embeds its creation time: sorting on _id = newest accounts first.
    users.find({}, { projection: { name: 1, email: 1, role: 1 } }).sort({ _id: -1 }).toArray(),
    progress
      .find({}, { projection: { completed: 1, passAttempts: 1, code: 1, streak: 1, bestStreak: 1, updatedAt: 1 } })
      .toArray(),
    preferences.find({}, { projection: { name: 1 } }).toArray(),
  ]);

  const progressByUser = new Map(progressDocs.map((d) => [d._id.toHexString(), d]));
  const preferencesByUser = new Map(preferenceDocs.map((d) => [d._id.toHexString(), d]));
  const total = totalExerciseCount();

  const rows = userDocs.map((u) => {
    const id = u._id.toHexString();
    const prog = progressByUser.get(id);
    const done = completedCount(prog?.completed || {});
    return {
      id,
      // The first name chosen in the app wins over the Google account's full name.
      name: preferencesByUser.get(id)?.name || u.name || null,
      email: u.email ?? null,
      role: u.role ?? "student",
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
      streak: prog?.streak ?? 0,
      bestStreak: prog?.bestStreak ?? 0,
      updatedAt: prog?.updatedAt ?? null,
    };
  });

  return { rows, hardest: hardestExercises(exerciseStats(progressDocs), 10) };
}

export default async function AdminPage() {
  const access = await checkAdminAccess();
  if (!access.ok) {
    return (
      <Shell>
        <Message text={access.message} />
      </Shell>
    );
  }

  const data = await loadDashboard().catch(() => null);
  if (!data) {
    return (
      <Shell>
        <Message text="Impossible de joindre MongoDB pour le moment." />
      </Shell>
    );
  }

  const { rows, hardest } = data;
  const total = totalExerciseCount();
  const avgPct = rows.length ? Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length) : 0;
  const completedCourse = rows.filter((r) => r.pct === 100).length;

  return (
    <Shell>
      <h1 className="text-2xl mb-1">Suivi des apprenant·es</h1>
      <p className="text-[14.5px] mb-9" style={{ color: "var(--ink-soft)" }}>
        {rows.length} compte{rows.length > 1 ? "s" : ""} · {avgPct}% de progression moyenne · {completedCourse} parcours
        terminé{completedCourse > 1 ? "s" : ""}
      </p>

      <h2 className="text-lg mb-1">Exercices où ça bloque</h2>
      <p className="text-[13.5px] mb-4 max-w-[70ch]" style={{ color: "var(--ink-soft)" }}>
        Les exercices commencés mais pas encore réussis par le plus d&apos;élèves, puis ceux qui demandent le plus
        d&apos;essais avant de réussir. « Essais ratés » compte les clics sur « Vérifier » qui ont échoué juste avant
        la réussite.
      </p>
      {hardest.length === 0 ? (
        <div className="mb-10">
          <Message text="Rien à signaler pour l'instant : aucun exercice commencé sans être réussi, ni réussi après des essais ratés." />
        </div>
      ) : (
        <div className="mb-10">
          <Card>
            <table className="w-full text-[13.5px] border-collapse min-w-[680px]">
              <thead>
                <HeadRow columns={["Exercice", "Bloqué·es", "Réussi", "Essais ratés (moy.)", "Du 1er coup"]} />
              </thead>
              <tbody>
                {hardest.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{s.title}</span>
                      <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                        {s.phaseLabel} · {s.chapterTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: s.stuck ? "var(--error)" : "var(--ink-faint)" }}>
                      {s.stuck}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                      {s.passed}/{s.started}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                      {s.avgFailures === null ? "—" : formatAvg(s.avgFailures)}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                      {s.passed ? `${Math.round((s.firstTry / s.passed) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <h2 className="text-lg mb-1">Apprenant·es</h2>
      <p className="text-[13.5px] mb-4" style={{ color: "var(--ink-soft)" }}>
        Clique sur un nom pour voir le détail exercice par exercice, avec son code.
      </p>
      {rows.length === 0 ? (
        <Message text="Personne ne s'est encore connecté." />
      ) : (
        <Card>
          <table className="w-full text-[13.5px] border-collapse min-w-[640px]">
            <thead>
              <HeadRow columns={["Nom", "Email", "Progression", "Exercices", "Série", "Dernière activité", "Rôle"]} />
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/eleve/${r.id}`}>{r.name || "(sans nom)"}</Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{r.email || "—"}</td>
                  <td className="px-4 py-3"><ProgressBar pct={r.pct} /></td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{r.done}/{total}</td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                    🔥 {r.streak}{r.bestStreak > r.streak ? ` (record ${r.bestStreak})` : ""}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-faint)" }}>{formatDate(r.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[10px] uppercase border rounded-[5px] px-1.5 py-px font-semibold"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-faint)" }}
                    >
                      {r.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Shell>
  );
}
