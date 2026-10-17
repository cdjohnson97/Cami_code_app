"use client";

import { useAppStore } from "@/store/useAppStore";
import { PHASE_ORDER, CURRICULUM } from "@/lib/curriculum";
import { completedCount, totalExerciseCount, phaseProgress } from "@/lib/progress";
import { PART_META } from "@/lib/partMeta";
import { BADGES } from "@/lib/progress";

export function StatsPage() {
  const completed = useAppStore((s) => s.completed);
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  const streak = useAppStore((s) => s.streak);
  const bestStreak = useAppStore((s) => s.bestStreak);

  const total = totalExerciseCount();
  const done = completedCount(completed);
  const pct = total ? Math.round((done / total) * 100) : 0;

  const cards = [
    { icon: "✅", value: `${done}/${total}`, label: "exercices réussis" },
    { icon: "📈", value: `${pct}%`, label: "du parcours terminé" },
    { icon: "🏅", value: `${Object.keys(earnedBadges).length}/${BADGES.length}`, label: "badges obtenus" },
    { icon: "🔥", value: streak, label: "jours de suite" },
    { icon: "🏆", value: bestStreak, label: "meilleure série" },
  ];

  return (
    <div>
      <h1 className="text-2xl mb-2">Mes statistiques</h1>
      <p className="text-[14.5px] mb-7" style={{ color: "var(--ink-soft)" }}>Ta progression, en un coup d&apos;œil.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-[760px] mb-7">
        {cards.map((c, i) => (
          <div key={i} className="rounded-(--radius) border px-5 py-5" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="font-display text-2xl font-bold">{c.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--ink-faint)" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-(--radius) border px-5 py-5 max-w-[640px]" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="text-[13.5px] mb-4" style={{ color: "var(--ink-soft)" }}>Progression par partie</div>
        <div className="flex flex-col gap-3">
          {PHASE_ORDER.map((pid) => {
            const phase = CURRICULUM[pid];
            const p = phaseProgress(phase, completed);
            const meta = PART_META[pid];
            return (
              <div key={pid} className="flex items-center gap-3 text-[12.5px]">
                <span className="flex-none w-[70px] font-bold" style={{ color: "var(--ink)" }}>{phase.shortLabel}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                  <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: meta.color }} />
                </div>
                <span className="flex-none font-mono text-[11.5px] w-[46px] text-right" style={{ color: "var(--ink-faint)" }}>{p.done}/{p.total}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
