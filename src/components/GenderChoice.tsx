"use client";

import { GENDER_OPTIONS } from "@/lib/genre";
import type { Gender } from "@/lib/types";

/** "Au féminin / Au masculin / Peu importe" — used in the welcome dialog and in Réglages. */
export function GenderChoice({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) {
  return (
    <div role="radiogroup" aria-label="Accord des textes" className="flex gap-2 flex-wrap">
      {GENDER_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className="rounded-lg border px-3.5 py-2 text-[13.5px] cursor-pointer"
            style={
              selected
                ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)", fontWeight: 600 }
                : { borderColor: "var(--line-strong)", color: "var(--ink-soft)", background: "var(--bg)" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
