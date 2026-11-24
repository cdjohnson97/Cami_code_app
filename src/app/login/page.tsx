"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";
import { Shell } from "@/app/admin/ui";
import { AppLink } from "@/components/AppLink";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NextAuth redirige vers /login?error=... quand la connexion échoue.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        const map: Record<string, string> = {
          Callback: "Identifiant ou mot de passe incorrect.",
          OAuthCallback: "La connexion avec Google a échoué.",
          OAuthSignin: "La connexion avec Google a échoué.",
          OAuthAccountNotLinked: "Ce compte Google n’est pas lié à un compte CaMI.",
          AccessDenied: "Connexion refusée.",
          default: "La connexion a échoué. Réessayez.",
        };
        setError(map[err] ?? map.default);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRedirecting(true);
    setError(null);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Email et mot de passe requis.");
      setRedirecting(false);
      return;
    }

    const ok = await signIn("email", {
      email,
      password,
      action: mode,
      redirect: false,
    });
    if (ok?.ok) {
      window.location.assign("/");
    } else if (ok?.error) {
      setError(typeof ok.error === "string" ? ok.error : "Identifiant ou mot de passe incorrect.");
      setRedirecting(false);
    } else {
      setError("Connexion impossible. Réessayez.");
      setRedirecting(false);
    }
  }

  async function handleGoogle() {
    setRedirecting(true);
    setError(null);
    void signIn("google", { redirectTo: "/" });
  }

  return (
    <Shell>
      <div className="max-w-[460px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <Mascot mood="wave" size={72} interactive={false} className="mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
            {mode === "signup" ? "Créer un compte" : "Connexion"}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>
            CaMI — apprendre à coder, puis apprivoiser l’IA.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-(--radius) border px-4 py-3"
            style={{ background: "var(--destructive-soft)", borderColor: "var(--destructive)", color: "var(--destructive)" }}
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-(--radius) border p-6 mb-6"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--ink-soft)" }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete={mode === "signup" ? "email" : "username"}
                required
                className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--ink-soft)" }}>
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              />
            </div>
            <button
              className="btn-primary w-full"
              disabled={redirecting}
            >
              {redirecting ? "…" : mode === "signup" ? "Créer le compte" : "Se connecter"}
            </button>
          </form>

          <div className="mt-5 border-t pt-4 flex flex-col gap-2">
            <p className="text-[13px] text-center" style={{ color: "var(--ink-soft)" }}>
              — ou —
            </p>
            <button
              onClick={handleGoogle}
              disabled={redirecting}
              className="btn-ghost w-full text-[13px] flex items-center justify-center gap-2"
            >
              🔑 Se connecter avec Google
            </button>
          </div>

          <p className="mt-5 text-center text-[13px]" style={{ color: "var(--ink-faint)" }}>
            Déjà un compte ?{" "}
            <button
              onClick={() => setMode("signin")}
              className="underline underline-offset-2" style={{ color: "var(--accent)" }}
            >
              Se connecter
            </button>{" "}
            Pas encore ?{" "}
            <button
              onClick={() => setMode("signup")}
              className="underline underline-offset-2" style={{ color: "var(--accent)" }}
            >
              Créer un compte
            </button>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-[13px] mb-3" style={{ color: "var(--ink-soft)" }}>
            Continuer sans compte :
          </p>
          <AppLink to="/" className="btn-ghost btn-sm text-[13px]">
            Découvrir le premier chapitre
          </AppLink>
        </motion.div>
      </div>
    </Shell>
  );
}
