"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";
import SweetAlert from "sweetalert2";
import { Card, Message, Shell } from "@/app/admin/ui";
import { copyToClipboard } from "@/lib/clipboard";

const LOTTIE_CLASS = "https://assets10.lottiefiles.com/packages/lf20_1cy2pSff.json";
const LOTTIE_USERS = "https://assets9.lottiefiles.com/packages/lf20_JCAtExltfu.json";
const LOTTIE_TASK = "https://assets9.lottiefiles.com/packages/lf20_tfbnohll.json";

type MyClass = {
  id: string;
  code: string;
  name: string;
  memberCount: number;
};

type Capability = {
  icon: string;
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
};

export default function EnseignantDashboard() {
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/classes")
      .then((r) => {
        if (!r.ok) throw new Error("Non autorisé");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setMyClasses(data.classes ?? []);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger vos classes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    if (!name) return;

    const codeExpiresAt = (formData.get("codeExpiresAt") as string) || undefined;
    const maxStudents = (formData.get("maxStudents") as string) || undefined;

    setCreating(true);
    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name, codeExpiresAt, maxStudents: maxStudents ? Number(maxStudents) : undefined }),
    });
    setCreating(false);
    if (r.ok) {
      form.reset();
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de créer la classe" });
    }
  }

  async function handleCopyCode(code: string) {
    const ok = await copyToClipboard(code);
    if (ok) {
      SweetAlert.fire({ icon: "success", title: "Code copié !", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
    }
  }

  const capabilities: Capability[] = [
    {
      icon: "➕",
      title: "Créer une classe",
      desc: "Générez un code d'invitation à partager avec vos élèves.",
      onClick: () => {
        const el = document.getElementById("form-create-class");
        el?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      icon: "📝",
      title: "Créer un devoir",
      desc: "Assignez un exercice à une classe avec une date limite.",
      href: "#devoirs",
    },
    {
      icon: "📢",
      title: "Publier une annonce",
      desc: "Diffusez un message à tous les élèves d'une classe.",
      href: "#annonces",
    },
    {
      icon: "👥",
      title: "Gérer les élèves",
      desc: "Ajoutez ou retirez des membres de vos classes.",
      href: "#eleves",
    },
    {
      icon: "🏆",
      title: "Créer des badges",
      desc: "Récompensez vos élèves avec des badges de classe.",
      href: "#badges",
    },
  ];

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20">
          <Lottie src={LOTTIE_CLASS} style={{ height: 120, width: 120 }} loop />
          <p className="mt-4 text-[14px]" style={{ color: "var(--ink-soft)" }}>Chargement…</p>
        </div>
      </Shell>
    );
  }
  if (error) return <Shell><Message text={error} /></Shell>;

  return (
    <Shell>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-baseline gap-2 mb-8"
        >
          <h1 className="text-2xl font-semibold">Mon espace enseignant</h1>
          <p className="text-[13.5px]" style={{ color: "var(--ink-soft)" }}>
            Gérez vos classes, créez des devoirs et suivez la progression de vos élèves.
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Barre d'actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex flex-wrap gap-3"
      >
        <Link
          href="#form-create-class"
          onClick={() => {
            const el = document.getElementById("form-create-class");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="btn-primary btn-sm text-[13px] px-4 py-2.5"
        >
          ➕ Nouvelle classe
        </Link>
        <button
          className="btn-ghost btn-sm text-[13px] px-4 py-2.5"
          onClick={() => {
            const el = document.getElementById("form-create-class");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          📋 Voir le formulaire
        </button>
      </motion.div>

      {/* Présentation des capacités (toujours visible pour guider l'enseignant) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <span style={{ color: "var(--accent)" }}>🎯</span> Ce que vous pouvez faire
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {capabilities.map((cap, i) => (
            <div
              key={cap.title}
              className="p-5 cursor-pointer hover:border-accent/50 transition-colors rounded-xl border"
              style={{ background: "var(--paper)", borderColor: "var(--line)" }}
              onClick={cap.onClick}
            >
              <Card>
                <div className="text-2xl mb-3">{cap.icon}</div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--ink)" }}>
                  {cap.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {cap.desc}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Formulaire de création de classe */}
      <motion.div
        id="form-create-class"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <span style={{ color: "var(--accent)" }}>➕</span> Créer une nouvelle classe
        </h2>
        <Card>
          <form onSubmit={handleCreateClass} className="grid md:grid-cols-3 gap-4">
            <div className="col-span-4 md:col-span-2">
              <input
                name="name"
                placeholder="Nom de la classe (ex: 3ème A)"
                className="rounded-[9px] border px-4 py-3 text-[14.5px] outline-none w-full"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                required
              />
            </div>
            <div>
              <input
                name="codeExpiresAt"
                type="date"
                className="rounded-[9px] border px-4 py-3 text-[14.5px] outline-none w-full"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              />
            </div>
            <div>
              <input
                name="maxStudents"
                type="number"
                placeholder="Max élèves"
                min="1"
                className="rounded-[9px] border px-4 py-3 text-[14.5px] outline-none w-full"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              />
            </div>
            <button
              className="btn-primary btn-sm col-span-4 md:col-span-1 self-end md:self-start"
              disabled={creating}
            >
              {creating ? "Création…" : "Créer la classe"}
            </button>
          </form>
          <p className="mt-3 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
            Le code d'invitation à 6 caractères sera généré automatiquement. Partagez-le avec vos élèves pour qu'ils rejoignent la classe.
          </p>
        </Card>
      </motion.div>

      {/* Mes classes */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <Lottie src={LOTTIE_CLASS} style={{ height: 20, width: 20 }} />
          Mes classes ({myClasses.length})
        </h2>

        {myClasses.length === 0 ? (
          <Card>
            <div className="px-6 py-12 text-center" style={{ color: "var(--ink-soft)" }}>
              <div className="text-4xl mb-4">📭</div>
              <p className="mb-4">Vous n'avez aucune classe pour l'instant.</p>
              <p className="text-[13px] mb-6">
                Créez votre première classe ci-dessus, puis partagez le code d'invitation avec vos élèves.
              </p>
              <button
                onClick={() => {
                  const el = document.getElementById("form-create-class");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-primary btn-sm"
              >
                Créer ma première classe
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {myClasses.map((c) => (
              <Link
                key={c.id}
                href={`/enseignant/classes/${c.id}`}
                className="rounded-2xl border overflow-hidden group transition-all hover:shadow-lg hover:border-accent/50"
                style={{ background: "var(--paper)", borderColor: "var(--line)" }}
              >
                <div className="px-6 py-5 border-b" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-xl font-bold" style={{ color: "var(--ink)" }}>{c.name}</span>
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-accent-soft" style={{ borderColor: "var(--accent)" }}>
                      <span className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>{c.code}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleCopyCode(c.code);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        style={{ color: "var(--accent-foreground)" }}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                    {c.memberCount} membre{c.memberCount > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-[12px] font-medium" style={{ color: "var(--ink-faint)" }}>
                    Ouvrir les détails → Devoirs, annonces, élèves, badges, export
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </Shell>
  );
}
