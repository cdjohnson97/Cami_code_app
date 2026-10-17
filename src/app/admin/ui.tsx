import type { ReactNode } from "react";
import Link from "next/link";

// Building blocks shared by the /admin pages (server components).

export function Shell({ children, back }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="min-h-screen px-6 py-10 md:px-12" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-baseline gap-2 mb-8">
          <span
            className="font-mono text-[13px] font-semibold rounded-[6px] border-[1.5px] px-1.5 py-px"
            style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
          >
            {"</>"}
          </span>
          <span className="font-display text-[19px] font-semibold">CaMI · Administration</span>
        </div>
        {back && (
          <Link href="/admin" className="inline-block text-[13.5px] mb-5 no-underline">
            ← Tous les apprenant·es
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}

export function Message({ text }: { text: string }) {
  return (
    <div
      className="rounded-(--radius) border px-6 py-5 max-w-[560px]"
      style={{ background: "var(--paper)", borderColor: "var(--line)", color: "var(--ink-soft)" }}
    >
      {text}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-(--radius) border overflow-hidden overflow-x-auto max-w-full" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      {children}
    </div>
  );
}

export function HeadRow({ columns }: { columns: string[] }) {
  return (
    <tr style={{ background: "var(--sidebar)" }}>
      {columns.map((h) => (
        <th key={h} className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
          {h}
        </th>
      ))}
    </tr>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 rounded-full overflow-hidden flex-none" style={{ background: "var(--line)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
      </div>
      <span style={{ color: "var(--ink-soft)" }}>{pct}%</span>
    </div>
  );
}

export const formatDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** "1,5" — French decimal, at most one digit. */
export const formatAvg = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
