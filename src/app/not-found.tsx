import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page introuvable · CaMI" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div className="text-center max-w-[44ch]">
        <span className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Erreur 404</span>
        <h1 className="text-2xl mt-2 mb-3">Cette page n&apos;existe pas</h1>
        <p className="text-[14.5px] mb-6" style={{ color: "var(--ink-soft)" }}>
          Le lien est peut-être incomplet, ou le chapitre a changé de nom.
        </p>
        <Link className="btn-primary" href="/">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
