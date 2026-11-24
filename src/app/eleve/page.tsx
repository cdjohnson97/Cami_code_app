"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";
import SweetAlert from "sweetalert2";
import { Card, HeadRow, Message, Shell } from "@/app/admin/ui";
import { copyToClipboard } from "@/lib/clipboard";
import { QrCode } from "@/components/QrCode";

const LOTTIE_CLASS = "https://assets10.lottiefiles.com/packages/lf20_1cy2pSff.json";
const LOTTIE_TASK = "https://assets9.lottiefiles.com/packages/lf20_tfbnohll.json";
const LOTTIE_STUDENTS = "https://assets9.lottiefiles.com/packages/lf20_JCAtExltfu.json";

type Annonce = {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

type Devoir = {
  id: string;
  classId: string;
  exerciseId: string;
  title: string;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

type Me = {
  role: string;
  classId: string | null;
  name: string | null;
  email: string | null;
};

export default function ElevePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [classe, setClasse] = useState<{ id: string; code: string; name: string } | null>(null);
  const [soumisLoading, setSoumisLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meR = await fetch("/api/me");
        if (!meR.ok) throw new Error("Non connecté");
        const meData = await meR.json();
        if (!cancelled) setMe(meData);

        if (meData.role !== "student" || !meData.classId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const [clsR, annoncesR, devoirsR, badgesR] = await Promise.all([
          fetch(`/api/classes/${meData.classId}`),
          fetch(`/api/annonces?classId=${meData.classId}`),
          fetch(`/api/devoirs?classId=${meData.classId}`),
          fetch(`/api/classes/${meData.classId}/badges`),
        ]);
        if (!clsR.ok || !annoncesR.ok || !devoirsR.ok || !badgesR.ok) throw new Error("Impossible de charger la classe");

        const cls = await clsR.json();
        const annoncesData = await annoncesR.json();
        const devoirsData = await devoirsR.json();
        const badgesData = await badgesR.json();

        if (!cancelled) {
          setClasse({ id: cls.id, code: cls.code, name: cls.name });
          setAnnonces(annoncesData.annonces ?? []);
          setDevoirs(devoirsData.devoirs ?? []);
          setBadges(badgesData.badges ?? []);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger votre espace élève.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSoumettre(devoirId: string) {
    if (soumisLoading.has(devoirId)) return;
    setSoumisLoading((prev) => new Set([...prev, devoirId]));
    try {
      const r = await fetch(`/api/devoirs/${devoirId}/soumis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "termine", note: "" }),
      });
      if (r.ok) {
        SweetAlert.fire({ icon: "success", title: "Devoir soumis", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
        window.location.reload();
      } else {
        const d = await r.json().catch(() => ({}));
        SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de soumettre le devoir" });
      }
    } finally {
      setSoumisLoading((prev) => { const next = new Set(prev); next.delete(devoirId); return next; });
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
  if (!me) return <Shell><Message text="Utilisateur introuvable." /></Shell>;
  if (me.role !== "student") {
    return (
      <Shell>
        <Message text="Cette page est réservée aux élèves." />
        <p className="mt-4 text-center"><Link href="/enseignant" className="btn-primary btn-sm">Tableau de bord enseignant</Link></p>
      </Shell>
    );
  }
  if (!me.classId || !classe) {
    return (
      <Shell>
        <Message text="Vous n'êtes inscrit dans aucune classe." />
        <p className="mt-4 text-center">Demandez à votre enseignant·e un code d'invitation à 6 caractères, puis saisissez-le dans vos réglages.</p>
      </Shell>
    );
  }

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com"}/rejoindre?code=${classe.code}`;

  return (
    <Shell>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-baseline gap-2 mb-8"
        >
          <Link href="/" className="inline-block text-[13.5px] no-underline mb-5" style={{ color: "var(--accent)" }}>
            ← Accueil
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="max-w-[800px]">
        {/* En-tête classe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-8 mb-8" style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--ink)" }}>{classe.name}</h1>
              <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>
                Votre classe — code : <span className="font-mono font-bold" style={{ color: "var(--accent)" }}>{classe.code}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-accent-soft" style={{ borderColor: "var(--accent)" }}>
                <span className="font-mono text-xl font-bold" style={{ color: "var(--accent)" }}>{classe.code}</span>
                <button
                  onClick={() => copyToClipboard(classe.code)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  style={{ color: "var(--accent-foreground)" }}
                >
                  📋
                </button>
              </div>
              <div className="flex flex-col items-end">
                <QrCode data={joinUrl} size={140} />
                <p className="text-[11px] text-center mt-1" style={{ color: "var(--ink-faint)" }}>
                  Code d'invitation
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Annonces */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>📢</span> Annonces ({annonces.length})
          </h2>
          <Card>
            {annonces.length === 0 ? (
              <p className="text-[13px] text-center py-8" style={{ color: "var(--ink-faint)" }}>
                Aucune annonce pour l'instant.
              </p>
            ) : (
              <div className="space-y-3">
                {annonces.map((a) => (
                  <div key={a.id} className="rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--paper)" }}>
                    <p className="font-semibold" style={{ color: "var(--ink)" }}>{a.title}</p>
                    <p className="text-[13px] mt-1" style={{ color: "var(--ink-soft)" }}>{a.content}</p>
                    <p className="text-[11px] mt-2" style={{ color: "var(--ink-faint)" }}>
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Devoirs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <Lottie src={LOTTIE_TASK} style={{ height: 20, width: 20 }} />
            Devoirs ({devoirs.length})
          </h2>
          <Card>
            {devoirs.length === 0 ? (
              <p className="text-[13px] text-center py-8" style={{ color: "var(--ink-faint)" }}>
                Aucun devoir pour l'instant.
              </p>
            ) : (
              <table className="w-full text-[13.5px] border-collapse">
                <thead>
                  <HeadRow columns={["Titre", "Exercice", "Date limite", "Statut", "Action"]} />
                </thead>
                <tbody>
                  {devoirs.map((d) => (
                    <tr key={d.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                      <td className="px-4 py-3 font-semibold">{d.title}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{d.exerciseId}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                        {d.dueDate ? new Date(d.dueDate).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-[10px] uppercase border rounded-[5px] px-1.5 py-px font-semibold"
                          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                        >
                          À soumettre
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSoumettre(d.id)}
                          disabled={soumisLoading.has(d.id)}
                          className="btn-primary btn-sm text-[12px] px-3 py-1.5"
                        >
                          {soumisLoading.has(d.id) ? "…" : "Soumettre"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>🏆</span> Badges ({badges.length})
          </h2>
          <Card>
            <div className="flex flex-wrap gap-4">
              {badges.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: "var(--ink-faint)" }}>
                  Aucun badge pour l'instant.
                </p>
              ) : (
                badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                    <span className="text-3xl">{b.icon}</span>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--ink)" }}>{b.name}</p>
                      <p className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{b.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </Shell>
  );
}
