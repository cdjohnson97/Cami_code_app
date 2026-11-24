"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";
import SweetAlert from "sweetalert2";
import { copyToClipboard } from "@/lib/clipboard";
import { Card, HeadRow, Message, Shell } from "@/app/admin/ui";
import { QrCode } from "@/components/QrCode";

type Member = {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
};

type ClassDetail = {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  members: Member[];
};

// Lottie animation URLs (LottieFiles public)
const LOTTIE_STUDENTS = "https://assets9.lottiefiles.com/packages/lf20_JCAtExltfu.json";
const LOTTIE_TEACHERS = "https://assets9.lottiefiles.com/packages/lf20_1cy2pSff.json";
const LOTTIE_CLASS = "https://assets10.lottiefiles.com/packages/lf20_1cy2pSff.json";

export default function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      try {
        const r = await fetch(`/api/classes/${id}`);
        if (!r.ok) throw new Error("Impossible de charger la classe");
        const d = await r.json();
        if (!cancelled) setData(d);
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
      SweetAlert.fire({
        icon: "success",
        title: "Code copié !",
        text: "Le code d'accès a été copié dans le presse-papiers.",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        customClass: { popup: "bg-accent text-accent-foreground" },
      });
    } else {
      SweetAlert.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de copier le code.",
      });
    }
  }

  async function handleDeleteClass() {
    const result = await SweetAlert.fire({
      title: "Supprimer la classe ?",
      text: "Les élèves ne seront plus liés à aucune classe. Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    const r = await fetch(`/api/classes/${data!.id}`, { method: "DELETE" });
    if (r.ok) {
      SweetAlert.fire({
        icon: "success",
        title: "Classe supprimée",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      window.location.href = "/admin/classes";
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer la classe." });
    }
  }

  async function handleRemoveMember(member: Member) {
    const result = await SweetAlert.fire({
      title: "Retirer ce membre ?",
      text: `${member.name} ne fera plus partie de cette classe.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Retirer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeMember", classId: data!.id, userId: member.userId }),
    });
    if (r.ok) {
      SweetAlert.fire({
        icon: "success",
        title: "Membre retiré",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      window.location.reload();
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible de retirer le membre." });
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20">
          <Lottie src={LOTTIE_CLASS} style={{ height: 120, width: 120 }} loop />
          <p className="mt-4 text-[14px]" style={{ color: "var(--ink-soft)" }}>
            Chargement de la classe…
          </p>
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
          exit={{ opacity: 0, y: -20 }}
          className="flex items-baseline gap-2 mb-8"
        >
          <Link href="/admin/classes" className="inline-block text-[13.5px] no-underline mb-5" style={{ color: "var(--accent)" }}>
            ← Toutes les classes
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="max-w-[800px]">
        {/* En-tête de classe */}
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
                Code d'invitation à partager avec vos élèves et enseignants.
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
              <button
                onClick={handleDeleteClass}
                className="text-[12px] font-medium text-error hover:bg-error-soft rounded-lg px-3 py-1.5 transition-colors"
              >
                🗑 Supprimer la classe
              </button>
            </div>
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border p-8 mb-8 flex flex-col items-center" style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lottie src={LOTTIE_CLASS} style={{ height: 24, width: 24 }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>QR Code d'inscription</h2>
          </div>
          <p className="text-[13px] mb-6" style={{ color: "var(--ink-soft)" }}>
            Les élèves scannent ce code pour rejoindre la classe depuis leur téléphone.
          </p>
          <div className="flex justify-center">
            <QrCode data={joinUrl} size={260} />
          </div>
          <p className="mt-4 text-xs font-medium text-center" style={{ color: "var(--ink-faint)" }}>
            URL : {joinUrl}
          </p>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border p-6" style={{ background: "var(--paper)", borderColor: "var(--line)" }}
          >
            <div className="flex items-center gap-3">
              <Lottie src={LOTTIE_TEACHERS} style={{ height: 32, width: 32 }} />
              <div>
                <p className="text-[12px] font-medium" style={{ color: "var(--ink-faint)" }}>Enseignant·es</p>
                <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>{teachers.length}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border p-6" style={{ background: "var(--paper)", borderColor: "var(--line)" }}
          >
            <div className="flex items-center gap-3">
              <Lottie src={LOTTIE_STUDENTS} style={{ height: 32, width: 32 }} />
              <div>
                <p className="text-[12px] font-medium" style={{ color: "var(--ink-faint)" }}>Élèves</p>
                <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>{students.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enseignants */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>👨‍🏫</span> Enseignant·es ({teachers.length})
          </h2>
          <Card>
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <HeadRow columns={["Nom", "Email", "Action"]} />
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center" style={{ color: "var(--ink-faint)" }}>
                    Aucun enseignant·e pour l'instant.
                  </td></tr>
                ) : (
                  teachers.map((m) => (
                    <tr key={m.userId} className="border-t group" style={{ borderColor: "var(--line)", transition: "all 0.2s" }}>
                      <td className="px-4 py-3 font-semibold">{m.name || "(sans nom)"}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveMember(m)}
                          className="text-[12px] font-medium text-error hover:bg-error-soft rounded-lg px-3 py-1 transition-colors"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </motion.div>

        {/* Élèves */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>🎓</span> Élèves ({students.length})
          </h2>
          <Card>
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <HeadRow columns={["Nom", "Email", "Action"]} />
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center" style={{ color: "var(--ink-faint)" }}>
                    Aucun élève pour l'instant.
                  </td></tr>
                ) : (
                  students.map((m) => (
                    <tr key={m.userId} className="border-t group" style={{ borderColor: "var(--line)", transition: "all 0.2s" }}>
                      <td className="px-4 py-3 font-semibold">{m.name || "(sans nom)"}</td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveMember(m)}
                          className="text-[12px] font-medium text-error hover:bg-error-soft rounded-lg px-3 py-1 transition-colors"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </motion.div>
      </div>
    </Shell>
  );
}
