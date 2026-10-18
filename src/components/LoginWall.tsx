"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { flatChapters } from "@/lib/progress";
import { Mascot } from "./Mascot";
import { AppLink } from "./AppLink";

/** Shown instead of a chapter after the free one(s) when the learner isn't signed in. */
export function LoginWall({ chapterTitle }: { chapterTitle: string }) {
  const [redirecting, setRedirecting] = useState(false);
  const firstChapter = flatChapters()[0].chapter;

  return (
    <div
      className="flex flex-col items-center text-center max-w-[54ch] mx-auto my-12 px-8 py-9 rounded-(--radius) border"
      style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}
    >
      <Mascot mood="wave" size={80} interactive={false} className="mb-2.5" />
      <span className="font-mono text-xs uppercase tracking-wide mb-2.5" style={{ color: "var(--accent)" }}>🔐 Connexion requise</span>
      {/*   = non-breaking space: French quotes stay glued to the title. */}
      <h2 className="text-xl mb-2.5">Pour continuer vers «{" "}{chapterTitle}{" "}», connecte-toi</h2>
      <p className="text-[14.5px] leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>
        Le premier chapitre est en accès libre. Pour la suite du voyage, connecte-toi avec ton compte Google : ta
        progression sera sauvegardée et te suivra sur tous tes appareils. Ce que tu as déjà fait ici est conservé.
      </p>
      <button
        className="btn-primary"
        disabled={redirecting}
        onClick={() => {
          setRedirecting(true);
          // Back to this very chapter once signed in.
          void signIn("google", { redirectTo: window.location.pathname });
        }}
      >
        {redirecting ? "Redirection…" : "Se connecter avec Google"}
      </button>
      <AppLink to={firstChapter.id} className="btn-ghost btn-sm mt-3">← Revoir «{" "}{firstChapter.title}{" "}»</AppLink>
    </div>
  );
}
