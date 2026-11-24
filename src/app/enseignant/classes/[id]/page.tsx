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
const LOTTIE_STUDENTS = "https://assets9.lottiefiles.com/packages/lf20_JCAtExltfu.json";
const LOTTIE_TASK = "https://assets9.lottiefiles.com/packages/lf20_tfbnohll.json";

type Member = {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
};

type Devoir = {
  id: string;
  classId: string;
  title: string;
  exerciseId: string;
  dueDate: string | null;
  createdAt: string;
};

type Annonce = {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

type ClassDetail = {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  members: Member[];
  stats: {
    totalStudents: number;
    avgPct: number;
    completedCourse: number;
    totalExercises: number;
  };
  devoirs: Devoir[];
  annonces: Annonce[];
  badges: Badge[];
};

export default function EnseignantClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [soumisOpen, setSoumisOpen] = useState<string | null>(null);
  const [soumisData, setSoumisData] = useState<{ id: string; userId: string; name: string | null; email: string | null; status: string; submittedAt: string | null; note: string | null }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      try {
        const [statsR, badgesR, annoncesR] = await Promise.all([
          fetch(`/api/classes/${id}/stats`),
          fetch(`/api/classes/${id}/badges`),
          fetch(`/api/annonces?classId=${id}`),
        ]);
        if (!statsR.ok || !badgesR.ok || !annoncesR.ok) throw new Error("Impossible de charger la classe");
        const stats = await statsR.json();
        const badgesData = await badgesR.json();
        const annoncesData = await annoncesR.json();
        if (!cancelled) {
          setData({ ...stats, badges: badgesData.badges ?? [], annonces: [] });
          setAnnonces(annoncesData.annonces ?? []);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger la classe.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleCopyCode() {
    const ok = await copyToClipboard(data?.code ?? "");
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      SweetAlert.fire({ icon: "success", title: "Code copié !", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
    }
  }

  async function handleCreateDevoir(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const title = (formData.get("title") as string).trim();
    const exerciseId = (formData.get("exerciseId") as string).trim();
    const dueDate = (formData.get("dueDate") as string) || null;
    const classId = (await params).id;

    if (!title || !exerciseId) {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Titre et ID exercice requis" });
      return;
    }

    const r = await fetch("/api/devoirs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", classId, exerciseId, title, dueDate }),
    });
    if (r.ok) {
      form.reset();
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de créer le devoir" });
    }
  }

  async function handleCreateAnnonce(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const title = (formData.get("title") as string).trim();
    const content = (formData.get("content") as string).trim();
    const classId = (await params).id;

    if (!title || !content) {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Titre et contenu requis" });
      return;
    }

    const r = await fetch("/api/annonces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, title, content }),
    });
    if (r.ok) {
      form.reset();
      SweetAlert.fire({ icon: "success", title: "Annonce publiée", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de publier l'annonce" });
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const classId = (await params).id;
    const userId = formData.get("userId") as string;
    const memberRole = (formData.get("memberRole") as string) || "student";

    if (!userId) {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Sélectionnez un utilisateur" });
      return;
    }

    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addMember", classId, userId, memberRole }),
    });
    if (r.ok) {
      SweetAlert.fire({ icon: "success", title: "Membre ajouté", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible d'ajouter le membre" });
    }
  }

  async function handleRemoveMember(userId: string, userName: string) {
    const result = await SweetAlert.fire({
      title: "Retirer ce membre ?",
      text: `${userName} ne fera plus partie de cette classe.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Retirer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    const classId = (await params).id;
    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeMember", classId, userId }),
    });
    if (r.ok) {
      SweetAlert.fire({ icon: "success", title: "Membre retiré", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de retirer le membre" });
    }
  }

  async function handleExportClasse() {
    const classId = (await params).id;
    const r = await fetch(`/api/export/classes/${classId}`);
    if (r.ok) {
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `classe-${classId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      SweetAlert.fire({ icon: "success", title: "Export téléchargé", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible d'exporter la classe" });
    }
  }

  async function handleViewSoumis(devoirId: string) {
    setSoumisOpen(devoirId);
    setSoumisData([]);
    const r = await fetch(`/api/devoirs/${devoirId}/soumis`);
    if (r.ok) {
      const d = await r.json();
      setSoumisData(d.soumis ?? []);
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible de charger les soumissions" });
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
  if (!data) return <Shell><Message text="Classe introuvable." /></Shell>;

  const teachers = data.members.filter((m) => m.role === "teacher");
  const students = data.members.filter((m) => m.role === "student");
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com"}/rejoindre?code=${data.code}`;

  return (
    <Shell>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-baseline gap-2 mb-8"
        >
          <Link href="/enseignant" className="inline-block text-[13.5px] no-underline mb-5" style={{ color: "var(--accent)" }}>
            ← Mon tableau de bord
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="max-w-[800px]">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-8 mb-8" style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--ink)" }}>{data.name}</h1>
              <p className="text-[14px]" style={{ color: "var(--ink-soft)" }}>
                Code d'invitation à partager avec vos élèves.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-accent-soft" style={{ borderColor: "var(--accent)" }}>
                <span className="font-mono text-xl font-bold" style={{ color: "var(--accent)" }}>{data.code}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  style={{ color: "var(--accent-foreground)" }}
                >
                  {copied ? "✓" : "📋"}
                </button>
              </div>
              <div className="flex flex-col items-end">
                <QrCode data={joinUrl} size={140} />
                <p className="text-[11px] text-center mt-1" style={{ color: "var(--ink-faint)" }}>
                  Scannez pour rejoindre
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleExportClasse}
                  className="btn-ghost btn-sm text-[12px] px-3 py-1.5"
                >
                  📥 Exporter
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{
            label: "Élèves",
            value: data.stats.totalStudents,
            icon: LOTTIE_STUDENTS,
            color: "var(--accent)",
          }, {
            label: "Progression moy.",
            value: `${data.stats.avgPct}%`,
            icon: LOTTIE_CLASS,
            color: "var(--ink)",
          }, {
            label: "Parcours terminés",
            value: data.stats.completedCourse,
            icon: LOTTIE_TASK,
            color: "var(--ink)",
          }, {
            label: "Exercices",
            value: data.stats.totalExercises,
            icon: LOTTIE_CLASS,
            color: "var(--ink)",
          }].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-xl border p-6" style={{ background: "var(--paper)", borderColor: "var(--line)" }}
            >
              <div className="flex items-center gap-3">
                <Lottie src={stat.icon} style={{ height: 28, width: 28 }} />
                <div>
                  <p className="text-[11px] font-medium" style={{ color: "var(--ink-faint)" }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-wrap gap-3"
        >
          <button
            onClick={() => {}}
            className="btn-primary btn-sm"
            disabled
            style={{ opacity: 0.6 }}
          >
            📢 Créer une annonce
          </button>
          <button
            onClick={handleExportClasse}
            className="btn-ghost btn-sm"
          >
            📥 Exporter la classe
          </button>
        </motion.div>

        {/* 1. Créer un devoir */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>📝</span> Créer un devoir
          </h2>
          <Card>
            <form onSubmit={handleCreateDevoir} className="grid md:grid-cols-4 gap-4">
              <div className="col-span-4 md:col-span-2">
                <input
                  name="title"
                  placeholder="Titre du devoir (ex: Chapitre 3 - Boucles)"
                  className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                  required
                />
              </div>
              <div>
                <input
                  name="exerciseId"
                  placeholder="ID exercice (ex: ex_042)"
                  className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                  required
                />
              </div>
              <div>
                <input
                  name="dueDate"
                  type="date"
                  className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                />
              </div>
              <button className="btn-primary btn-sm col-span-4 md:col-span-1 self-end md:self-start">Créer le devoir</button>
            </form>
          </Card>
        </motion.div>

        {/* 2. Devoirs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <Lottie src={LOTTIE_TASK} style={{ height: 20, width: 20 }} />
            Devoirs ({data.devoirs.length})
          </h2>
          <Card>
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <HeadRow columns={["Titre", "Exercice", "Date limite", "Créé le", "Soumissions"]} />
              </thead>
              <tbody>
                {data.devoirs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--ink-faint)" }}>
                    Aucun devoir pour l'instant. Créez-en un ci-dessus.
                  </td></tr>
                ) : (
                  data.devoirs.map((d) => (
                    <tr key={d.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                      <td className="px-4 py-3 font-semibold">{d.title}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{d.exerciseId}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                        {d.dueDate ? new Date(d.dueDate).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-faint)" }}>
                        {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewSoumis(d.id)}
                          className="btn-ghost btn-sm text-[12px] px-3 py-1.5"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          {soumisOpen && (
            <div className="mt-4 rounded-xl border p-6" style={{ borderColor: "var(--line)", background: "var(--paper)" }}>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
                  Soumissions
                </h3>
                <button
                  onClick={() => setSoumisOpen(null)}
                  className="text-[12px]" style={{ color: "var(--ink-faint)" }}
                >
                  Fermer
                </button>
              </div>
              {soumisData.length === 0 ? (
                <p className="text-[13px] text-center py-6" style={{ color: "var(--ink-faint)" }}>
                  Aucune soumission pour l'instant.
                </p>
              ) : (
                <table className="w-full text-[13.5px] border-collapse">
                  <thead>
                    <HeadRow columns={["Élève", "Email", "Statut", "Rendu le", "Note"]} />
                  </thead>
                  <tbody>
                    {soumisData.map((s) => (
                      <tr key={s.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                        <td className="px-4 py-3 font-semibold">{s.name || "(sans nom)"}</td>
                        <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{s.email || "—"}</td>
                        <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{s.status}</td>
                        <td className="px-4 py-3" style={{ color: "var(--ink-faint)" }}>
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--ink-faint)" }}>
                          {s.note ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </motion.div>

        {/* 3. Élèves */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <Lottie src={LOTTIE_STUDENTS} style={{ height: 20, width: 20 }} />
            Élèves ({students.length})
          </h2>
          <Card>
            {/* Ajouter un membre */}
            <form onSubmit={handleAddMember} className="grid md:grid-cols-4 gap-3 mb-6">
              <div className="col-span-4 md:col-span-2">
                <select
                  name="userId"
                  className="rounded-[9px] border px-3 py-2 text-[13px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                >
                  <option value="">Sélectionner un utilisateur…</option>
                </select>
              </div>
              <div>
                <select
                  name="memberRole"
                  className="rounded-[9px] border px-3 py-2 text-[13px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                >
                  <option value="student">Élève</option>
                  <option value="teacher">Enseignant·e</option>
                </select>
              </div>
              <button className="btn-primary btn-sm col-span-4 md:col-span-1 self-end md:self-start">Ajouter</button>
            </form>

            {/* Liste des membres */}
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <HeadRow columns={["Nom", "Email", "Rôle", "Action"]} />
              </thead>
              <tbody>
                {data.members.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--ink-faint)" }}>
                    Aucun membre pour l'instant.
                  </td></tr>
                ) : (
                  data.members.map((m) => (
                    <tr key={m.userId} className="border-t" style={{ borderColor: "var(--line)" }}>
                      <td className="px-4 py-3 font-semibold">{m.name || "(sans nom)"}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-[10px] uppercase border rounded-[5px] px-1.5 py-px font-semibold"
                          style={{ borderColor: m.role === "teacher" ? "var(--accent)" : "var(--ink-faint)", color: m.role === "teacher" ? "var(--accent)" : "var(--ink-faint)" }}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.role !== "teacher" || teachers.length > 1 ? (
                          <button
                            onClick={() => handleRemoveMember(m.userId, m.name ?? m.email ?? "Ce membre")}
                            className="text-[11px]" style={{ color: "var(--error)" }}
                          >
                            Retirer
                          </button>
                        ) : (
                          <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                            Dernier enseignant
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </motion.div>

        {/* 4. Annonces */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>📢</span> Annonces ({annonces.length})
          </h2>
          <Card>
            <form onSubmit={handleCreateAnnonce} className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="col-span-4 md:col-span-2">
                <input
                  name="title"
                  placeholder="Titre de l'annonce"
                  className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                  required
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <textarea
                  name="content"
                  placeholder="Contenu de l'annonce"
                  rows={3}
                  className="rounded-[9px] border px-4 py-3 text-[14px] outline-none w-full"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                  required
                ></textarea>
              </div>
              <button className="btn-primary btn-sm col-span-4 md:col-span-1 self-end md:self-start">Publier l'annonce</button>
            </form>
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

        {/* 5. Badges de classe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>🏆</span> Badges de classe ({data.badges.length})
          </h2>
          <Card>
            <div className="flex flex-wrap gap-4">
              {data.badges.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: "var(--ink-faint)" }}>
                  Aucun badge pour l'instant. Créez votre premier badge ci-dessous.
                </p>
              ) : (
                data.badges.map((b) => (
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

          <form
            className="mt-6 grid md:grid-cols-2 gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const name = (formData.get("name") as string).trim();
              const description = (formData.get("description") as string).trim();
              const icon = (formData.get("icon") as string).trim() || "🏅";
              if (!name || !description) {
                SweetAlert.fire({ icon: "error", title: "Erreur", text: "Nom et description requis" });
                return;
              }
              const classId = (await params).id;
              fetch(`/api/classes/${classId}/badges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, icon }),
              }).then(async (r) => {
                if (r.ok) {
                  SweetAlert.fire({ icon: "success", title: "Badge créé", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
                  window.location.reload();
                } else {
                  const d = await r.json().catch(() => ({}));
                  SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de créer le badge" });
                }
              });
            }}
          >
            <input
              name="name"
              placeholder="Nom du badge (ex: Persévérant)"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              required
            />
            <input
              name="description"
              placeholder="Description (ex: A réussi tous les exercices du chapitre)"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              required
            />
            <input
              name="icon"
              placeholder="🏅"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            />
            <button className="btn-primary btn-sm col-span-2 md:col-span-1 self-end md:self-start">Créer le badge</button>
          </form>
        </motion.div>
      </div>
    </Shell>
  );
}
