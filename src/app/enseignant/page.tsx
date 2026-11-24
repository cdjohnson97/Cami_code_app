"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";
import SweetAlert from "sweetalert2";
import { Card, Message, Shell } from "@/app/admin/ui";

const LOTTIE_CLASS = "https://assets10.lottiefiles.com/packages/lf20_1cy2pSff.json";
const LOTTIE_USERS = "https://assets9.lottiefiles.com/packages/lf20_JCAtExltfu.json";
const LOTTIE_TASK = "https://assets9.lottiefiles.com/packages/lf20_tfbnohll.json";

type MyClass = {
  id: string;
  code: string;
  name: string;
  memberCount: number;
};

export default function EnseignantDashboard() {
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name }),
    });
    if (r.ok) {
      form.reset();
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de créer la classe" });
    }
  }

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
          <h1 className="text-2xl font-semibold">Mon tableau de bord enseignant</h1>
          <p className="text-[13.5px]" style={{ color: "var(--ink-soft)" }}>
            Gérez vos classes, créez des devoirs et suivez la progression de vos élèves.
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Créer une classe */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <span style={{ color: "var(--accent)" }}>➕</span> Créer une nouvelle classe
        </h2>
        <form
          className="flex gap-2.5 max-w-[520px]"
          onSubmit={handleCreateClass}
        >
          <input
            name="name"
            placeholder="Nom de la classe"
            className="rounded-[9px] border px-3 py-2 text-[14.5px] outline-none flex-1 max-w-[280px]"
            style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            required
          />
          <button className="btn-primary btn-sm">Créer</button>
        </form>
      </motion.div>

      {/* Mes classes */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <Lottie src={LOTTIE_CLASS} style={{ height: 20, width: 20 }} />
          Mes classes ({myClasses.length})
        </h2>

        {myClasses.length === 0 ? (
          <Card>
            <div className="px-6 py-8 text-center" style={{ color: "var(--ink-soft)" }}>
              <p>Vous n'avez aucune classe pour l'instant.</p>
              <p className="text-[12px] mt-2">Créez votre première classe ci-dessus, puis partagez le code d'invitation avec vos élèves.</p>
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
                    </div>
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                    {c.memberCount} membre{c.memberCount > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-[12px] font-medium" style={{ color: "var(--ink-faint)" }}>
                    Voir les détails →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Accès rapide */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Lottie src={LOTTIE_USERS} style={{ height: 32, width: 32 }} />
              <div>
                <p className="text-[12px] font-medium" style={{ color: "var(--ink-faint)" }}>Gérer les classes</p>
                <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>{myClasses.length}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px]" style={{ color: "var(--ink-soft)" }}>
              Créer, modifier et supprimer vos classes.
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Lottie src={LOTTIE_TASK} style={{ height: 32, width: 32 }} />
              <div>
                <p className="text-[12px] font-medium" style={{ color: "var(--ink-faint)" }}>Devoirs</p>
                <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>{myClasses.reduce((n, c) => n + c.memberCount, 0)}</p>
              </div>
            </div>
            <p className="mt-4 text-[13px]" style={{ color: "var(--ink-soft)" }}>
              Élèves total dans toutes vos classes.
            </p>
          </div>
        </Card>
      </motion.div>
    </Shell>
  );
}
