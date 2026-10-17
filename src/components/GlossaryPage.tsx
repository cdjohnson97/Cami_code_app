"use client";

import { useState } from "react";
import { GLOSSARY } from "@/lib/curriculum";
import { highlightCode } from "@/lib/highlight";

export function GlossaryPage() {
  const [q, setQ] = useState("");
  const items = GLOSSARY.filter(
    (g: { term: string; def: string }) =>
      !q || g.term.toLowerCase().includes(q.toLowerCase()) || g.def.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl mb-2">Glossaire</h1>
      <p className="text-[14.5px] mb-5" style={{ color: "var(--ink-soft)" }}>Tous les mots du parcours, expliqués simplement.</p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chercher un mot..."
        className="block w-full max-w-[420px] rounded-[10px] border px-3.5 py-2.5 mb-6 text-[14.5px] outline-none"
        style={{ borderColor: "var(--line-strong)", background: "var(--paper)", color: "var(--ink)" }}
      />

      <div className="flex flex-col gap-2.5 max-w-[720px]">
        {items.map((g: { id: string; term: string; tag: string; def: string; example?: Record<string, string> }) => (
          <div key={g.id} className="rounded-xl border px-5 py-3.5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
            <div className="flex items-center gap-2 flex-wrap font-display font-semibold text-base">
              {g.term}
              <span className="font-mono text-[10px] uppercase border rounded-[5px] px-1.5 py-px font-semibold" style={{ borderColor: "var(--line-strong)", color: "var(--ink-faint)" }}>
                {g.tag}
              </span>
            </div>
            <div className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--ink-soft)" }} dangerouslySetInnerHTML={{ __html: g.def }} />
            {g.example &&
              Object.entries(g.example).map(([lk, code]) => (
                <pre
                  key={lk}
                  className="mt-2.5 rounded-lg px-3.5 py-2.5 font-mono text-[12.5px] overflow-x-auto whitespace-pre"
                  style={{ background: "var(--editor-bg)", color: "var(--editor-ink)" }}
                  dangerouslySetInnerHTML={{ __html: highlightCode(code as string, lk === "pseudo" ? "pseudo" : "python") }}
                />
              ))}
          </div>
        ))}
        {items.length === 0 && <p style={{ color: "var(--ink-faint)" }}>Aucun résultat.</p>}
      </div>
    </div>
  );
}
