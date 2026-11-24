"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CodeEditor } from "./CodeEditor";
import { LottiePlayer } from "./LottiePlayer";
import AlgoEngine from "@/lib/algoEngine";

const DEFAULTS: Record<string, string> = {
  pseudo: `VARIABLE nom = "Toi"\nAFFICHER("Bonjour, " + nom)`,
  python: `nom = "Toi"\nprint("Bonjour, " + nom)`,
};

export function SandboxPage() {
  const sandboxLang = useAppStore((s) => s.sandboxLang);
  const setSandboxLang = useAppStore((s) => s.setSandboxLang);
  const sandboxCode = useAppStore((s) => s.sandboxCode);
  const setSandboxCode = useAppStore((s) => s.setSandboxCode);

  const [output, setOutput] = useState<{ lines?: string[]; err?: string } | null>(null);
  const code = sandboxCode[sandboxLang] ?? DEFAULTS[sandboxLang];

  function run() {
    const res = sandboxLang === "pseudo" ? AlgoEngine.runPseudo(code) : AlgoEngine.runPython(code);
    if (res.success) setOutput({ lines: res.output.length ? res.output : ["(pas de sortie)"] });
    else setOutput({ err: (res.error?.line ? `Ligne ${res.error.line} — ` : "") + res.error?.message });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl mb-2">Bac à sable</h1>
          <p className="text-[14.5px] m-0 max-w-[52ch]" style={{ color: "var(--ink-soft)" }}>Un espace libre pour expérimenter, sans exercice à réussir.</p>
        </div>
        <LottiePlayer
          src="/lottie/coding-desk.json"
          label="Quelqu'un code sur un ordinateur"
          className="hidden sm:block w-[190px] shrink-0 -mt-5"
        />
      </div>

      <div className="flex gap-2 mb-4">
        {(["pseudo", "python"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setSandboxLang(l)}
            className="rounded-lg border px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={sandboxLang === l ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : { borderColor: "var(--line-strong)", color: "var(--ink-soft)", background: "transparent" }}
          >
            {l === "pseudo" ? "Pseudocode" : "Python"}
          </button>
        ))}
      </div>

      <div className="max-w-[720px]">
        <CodeEditor value={code} onChange={(v) => setSandboxCode(sandboxLang, v)} lang={sandboxLang} />
        <div className="mt-3">
          <button className="btn-primary" onClick={run}>▷ Exécuter</button>
        </div>
        {output && (
          <div className="mt-3 rounded-[10px] border font-mono text-[13px] px-3.5 py-2.5" style={{ background: "var(--editor-bg)", borderColor: "var(--editor-line)" }}>
            {output.err ? (
              <div style={{ color: "#F2917F" }}>{output.err}</div>
            ) : (
              output.lines!.map((l, i) => <div key={i} style={{ color: "var(--editor-ink)" }} className="whitespace-pre-wrap py-px">{l}</div>)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
