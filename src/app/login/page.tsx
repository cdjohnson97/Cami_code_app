"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import SweetAlert from "sweetalert2";
import { swal } from "@/lib/swal";
import { Mascot } from "@/components/Mascot";
import { Shell } from "@/app/admin/ui";
import { AppLink } from "@/components/AppLink";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // NextAuth redirige vers /login?error=... quand la connexion échoue (Google OAuth surtout).
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
        swal({
          icon: "error",
          title: "Erreur de connexion",
          text: map[err] ?? map.default,
          confirmButtonText: "OK",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  /** Vérifie si un email est déjà associé à un compte (appel API serveur). */
  async function checkEmailExists(email: string): Promise<boolean> {
    try {
      const r = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) return false;
      const d = await r.json();
      return !!d.exists;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRedirecting(true);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      swal({
        icon: "error",
        title: "Champs requis",
        text: "Email et mot de passe sont requis.",
        confirmButtonText: "OK",
      });
      setRedirecting(false);
      return;
    }

    // À l'inscription : vérifier d'abord si l'email est déjà utilisé.
    if (mode === "signup") {
      const exists = await checkEmailExists(email);
      if (exists) {
        setRedirecting(false);
        const result = await swal({
          icon: "warning",
          title: "Ce compte existe déjà",
          text: "Un compte CaMI est déjà associé à cet email. Voulez-vous vous connecter à la place ?",
          showCancelButton: true,
          confirmButtonText: "Se connecter",
          cancelButtonText: "Réessayer",
          reverseButtons: true,
        });
        if (result.isConfirmed) {
          setMode("signin");
        }
        return;
      }
    }

    const ok = await signIn("email", {
      email,
      password,
      action: mode,
      redirect: false,
    });
    setRedirecting(false);

    if (ok?.ok) {
      window.location.assign("/");
    } else if (ok?.error) {
      swal({
        icon: "error",
        title: "Connexion échouée",
        text: typeof ok.error === "string" ? ok.error : "Identifiant ou mot de passe incorrect.",
        confirmButtonText: "OK",
      });
    } else {
      swal({
        icon: "error",
        title: "Connexion impossible",
        text: "Une erreur est survenue. Réessayez plus tard.",
        confirmButtonText: "OK",
      });
    }
  }

  async function handleGoogle() {
    setRedirecting(true);
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-(--radius) border p-6 mb-6"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-3.5" id="login-form">
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
          </form>

          <div className="mt-5 border-t pt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoogle}
                disabled={redirecting}
                className="btn-ghost text-[13px] flex items-center justify-center gap-2"
              >
                🔑 Google
              </button>
              <button
                type="submit"
                form="login-form"
                disabled={redirecting}
                className="w-full btn-ghost text-[13px] flex items-center justify-center gap-2"
              >
                {mode === "signup" ? "Créer un compte" : "Se connecter"}
              </button>
            </div>
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
