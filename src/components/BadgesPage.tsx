"use client";

import { useAppStore } from "@/store/useAppStore";
import { BADGES } from "@/lib/progress";

export function BadgesPage() {
  const earnedBadges = useAppStore((s) => s.earnedBadges);

  return (
    <div>
      <h1 className="text-2xl mb-2">Badges</h1>
      <p className="text-[14.5px] mb-7" style={{ color: "var(--ink-soft)" }}>{Object.keys(earnedBadges).length}/{BADGES.length} débloqués.</p>

      <div className="grid gap-3.5 max-w-[760px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
        {BADGES.map((b) => {
          const earned = !!earnedBadges[b.id];
          return (
            <div
              key={b.id}
              className="rounded-(--radius) border px-4 py-5 text-center"
              style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)", opacity: earned ? 1 : 0.5 }}
            >
              <div className="text-[32px] mb-2">{b.icon}</div>
              <div className="font-bold text-sm mb-1">{b.title}</div>
              <div className="text-xs leading-snug" style={{ color: "var(--ink-faint)" }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
