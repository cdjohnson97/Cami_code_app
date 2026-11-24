"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { PHASE_ORDER, CURRICULUM } from "@/lib/curriculum";
import { completedCount, totalExerciseCount, phaseProgress } from "@/lib/progress";
import { PART_META } from "@/lib/partMeta";
import { BADGES } from "@/lib/progress";

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-(--radius) border px-5 py-5"
      style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-display text-2xl font-bold"
      >
        {value}
      </motion.span>
      <div className="text-xs mt-1" style={{ color: "var(--ink-faint)" }}>{label}</div>
    </motion.div>
  );
}

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

  const count = 12;
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1)) * 100;
    const progress = (i / (count - 1)) * pct;
    points.push({ x, y: 100 - progress });
  }
  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");

  return (
    <div>
      <h1 className="text-2xl mb-2">Mes statistiques</h1>
      <p className="text-[14.5px] mb-7" style={{ color: "var(--ink-soft)" }}>Ta progression, en un coup dŒil.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-[760px] mb-8">
        {cards.map((c, i) => (
          <StatCard key={i} icon={c.icon} value={c.value as string} label={c.label} />
        ))}
      </div>

      <div className="rounded-(--radius) border px-5 py-5 max-w-[760px] mb-8" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-baseline gap-2 mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>Évolution de ta progression</h2>
          <span className="font-mono text-[12px]" style={{ color: "var(--ink-soft)" }}>{pct}%</span>
        </div>

        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: "block" }}>
          <motion.path
            d={`M0,100 ${pathD} L100,100 Z`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ fill: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
          />
          <motion.path
            d={pathD}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 3 }}
          />
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              style={{ fill: "var(--accent)" }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + (i / points.length) * 0.4, duration: 0.4 }}
            />
          ))}
        </svg>
      </div>

      <div className="rounded-(--radius) border px-5 py-5 max-w-[640px]" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="text-[13.5px] mb-4" style={{ color: "var(--ink-soft)" }}>Progression par partie</div>
        <div className="flex flex-col gap-3">
          {PHASE_ORDER.map((pid, i) => {
            const phase = CURRICULUM[pid];
            const p = phaseProgress(phase, completed);
            const meta = PART_META[pid];
            return (
              <motion.div
                key={pid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3 text-[12.5px]"
              >
                <span className="flex-none w-[70px] font-bold" style={{ color: "var(--ink)" }}>{phase.shortLabel}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: "var(--line)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: String(p.pct) + "%" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="flex-none font-mono text-[11.5px] w-[46px] text-right" style={{ color: "var(--ink-faint)" }}>{p.done}/{p.total}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
