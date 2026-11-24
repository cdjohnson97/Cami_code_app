"use client";

import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
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

/** Génère une série de points pour simuler l'évolution de la progression dans le temps. */
function buildProgressionSeries(pct: number): Array<{ name: string; value: number }> {
  const points: Array<{ name: string; value: number }> = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const progress = Math.round((i / (count - 1)) * pct);
    points.push({ name: `Jour ${i + 1}`, value: progress });
  }
  return points;
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

  const series = buildProgressionSeries(pct);

  return (
    <div>
      <h1 className="text-2xl mb-2">Mes statistiques</h1>
      <p className="text-[14.5px] mb-7" style={{ color: "var(--ink-soft)" }}>Ta progression, en un coup d'œil.</p>

      {/* Cartes de stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-[760px] mb-8">
        {cards.map((c, i) => (
          <StatCard key={i} icon={c.icon} value={c.value as string} label={c.label} />
        ))}
      </div>

      {/* Graphique en courbe : évolution de la progression */}
      <div className="rounded-(--radius) border px-5 py-5 max-w-[760px] mb-8" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-baseline gap-2 mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>Évolution de ta progression</h2>
          <span className="font-mono text-[12px]" style={{ color: "var(--ink-soft)" }}>{pct}%</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={series} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--ink-soft)" }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
                label={{ value: "Progression (%)", position: "insideLeft", offset: -10, fill: "var(--ink-soft)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: "9px" }}
                itemStyle={{ color: "var(--ink-soft)" }}
                labelStyle={{ color: "var(--ink-soft)", fontSize: 11 }}
              />
              <Legend verticalAlign="top" align="right" height={36} />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="color-mix(in srgb, var(--accent) 20%, transparent)" fillOpacity={0.6} strokeWidth={3} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} dot={{ fill: "var(--accent)", strokeWidth: 2, stroke: "var(--paper)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique en barres : progression par partie */}
      <div className="rounded-(--radius) border px-5 py-5 max-w-[640px]" style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="text-[13.5px] mb-4" style={{ color: "var(--ink-soft)" }}>Progression par partie</div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={PHASE_ORDER.map((pid) => {
                const phase = CURRICULUM[pid];
                const p = phaseProgress(phase, completed);
                return { name: phase.shortLabel, value: p.pct, color: PART_META[pid]?.color ?? "var(--accent)" };
              })}
              margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--ink-soft)" }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                contentStyle={{ background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: "9px" }}
                itemStyle={{ color: "var(--ink-soft)" }}
                labelStyle={{ color: "var(--ink-soft)", fontSize: 11 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
