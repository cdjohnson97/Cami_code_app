"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";
import SweetAlert from "sweetalert2";
import { copyToClipboard } from "@/lib/clipboard";
import { Card, HeadRow, Message, Shell } from "@/app/admin/ui";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  classes: { id: string; name: string; role: string }[];
};

type ClassRow = {
  id: string;
  code: string;
  name: string;
  memberCount: number;
  members: { userId: string; role: string; name: string | null; email: string | null }[];
};

const LOTTIE_CLASS = "https://assets10.lottiefiles.com/packages/lf20_1cy2pSff.json";
const LOTTIE_USERS = "https://assets9.lottiefiles.com/packages/lf20_JCAtExltfu.json";

export default function AdminClassesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [uRes, cRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/classes")]);
        if (!uRes.ok || !cRes.ok) throw new Error("Non autorisé");
        const uData = await uRes.json();
        const cData = await cRes.json();
        if (!cancelled) {
          setUsers(uData.users ?? []);
          setClasses(cData.classes ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les données.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCopyCode(code: string) {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      SweetAlert.fire({
        icon: "success",
        title: "Code copié !",
        text: `Le code ${code} est dans le presse-papiers.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible de copier." });
    }
  }

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
      SweetAlert.fire({
        icon: "success",
        title: "Classe créée",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de créer la classe" });
    }
  }

  async function handleDeleteClass(classId: string, className: string) {
    const result = await SweetAlert.fire({
      title: `Supprimer "${className}" ?`,
      text: "Les élèves ne seront plus liés à aucune classe. Irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    const r = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
    if (r.ok) {
      SweetAlert.fire({
        icon: "success",
        title: "Classe supprimée",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      window.location.reload();
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer." });
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const classId = formData.get("classId") as string;
    const userId = formData.get("userId") as string;
    const memberRole = (formData.get("memberRole") as string) || "student";

    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addMember", classId, userId, memberRole }),
    });
    if (r.ok) {
      SweetAlert.fire({
        icon: "success",
        title: "Membre ajouté",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      window.location.reload();
    } else {
      const d = await r.json().catch(() => ({}));
      SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible d'ajouter le membre" });
    }
  }

  async function handleRemoveMember(classId: string, userId: string, userName: string) {
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

    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeMember", classId, userId }),
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

  async function handleChangeRole(userId: string, selectEl: HTMLSelectElement) {
    const r = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectEl.value }),
    });
    if (r.ok) {
      SweetAlert.fire({
        icon: "success",
        title: "Rôle mis à jour",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } else {
      SweetAlert.fire({ icon: "error", title: "Erreur", text: "Impossible de changer le rôle." });
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
          <h1 className="text-2xl font-semibold">Gestion des classes</h1>
          <Link
            href="/admin"
            className="inline-block text-[13.5px] no-underline"
            style={{ color: "var(--accent)" }}
          >
            ← Retour au suivi des apprenant·es
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* --- Utilisateurs : changer le rôle --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <Lottie src={LOTTIE_USERS} style={{ height: 20, width: 20 }} />
          Utilisateurs — rôles
        </h2>
        <p className="text-[13.5px] mb-4" style={{ color: "var(--ink-soft)" }}>
          Passez un compte d'élève à enseignant (ou inversement).
        </p>
        <Card>
          <table className="w-full text-[13.5px] border-collapse min-w-[700px]">
            <thead>
              <HeadRow columns={["Nom", "Email", "Rôle actuel", "Nouveau rôle", "Classes"]} />
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t group hover:bg-accent-soft/50 transition-colors" style={{ borderColor: "var(--line)" }}>
                  <td className="px-4 py-3 font-semibold">{u.name || "(sans nom)"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{u.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[10px] uppercase border rounded-[5px] px-1.5 py-px font-semibold"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-faint)" }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
                      style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                      defaultValue={u.role}
                    >
                      <option value="student">Élève</option>
                      <option value="teacher">Enseignant·e</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    <button
                      className="ml-2 btn-primary btn-xs"
                      style={{
                        borderColor: "var(--line-strong)",
                        color: "var(--ink)",
                        background: "var(--bg)",
                        padding: "2px 8px",
                        fontSize: "12px",
                      }}
                      onClick={(e) => {
                        const select = (e.currentTarget as HTMLButtonElement).previousElementSibling as HTMLSelectElement;
                        handleChangeRole(u.id, select);
                      }}
                    >
                      Enregistrer
                    </button>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                    {u.classes.length === 0 ? "—" : u.classes.map((c) => `${c.name} (${c.role})`).join(", ")}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4" style={{ color: "var(--ink-faint)" }}>
                    Aucun utilisateur pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </motion.div>

      {/* --- Classes --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <Lottie src={LOTTIE_CLASS} style={{ height: 20, width: 20 }} />
          Classes
        </h2>
        <p className="text-[13.5px] mb-4" style={{ color: "var(--ink-soft)" }}>
          Créez une classe, partagez son code d'invitation avec vos élèves et enseignants.
        </p>

        <form
          className="flex gap-2.5 mb-8 max-w-[520px]"
          onSubmit={handleCreateClass}
        >
          <input
            name="name"
            placeholder="Nom de la classe"
            className="rounded-[9px] border px-3 py-2 text-[14.5px] outline-none flex-1 max-w-[280px]"
            style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            required
          />
          <button className="btn-primary btn-sm">Créer la classe</button>
        </form>

        {classes.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-faint)" }}>
            Aucune classe pour l'instant.
          </p>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border overflow-hidden cursor-pointer group transition-all hover:shadow-lg hover:border-accent/50"
                style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                onClick={() => { window.location.href = `/admin/classes/${c.id}`; }}
              >
                <div className="px-6 py-5 border-b" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-xl font-bold" style={{ color: "var(--ink)" }}>{c.name}</span>
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-accent-soft" style={{ borderColor: "var(--accent)" }}>
                      <span className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>{c.code}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(c.code);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        style={{ color: "var(--accent-foreground)" }}
                      >
                        {copiedCode === c.code ? "✓" : "📋"}
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                    {c.memberCount} membre{c.memberCount > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-xs font-medium" style={{ color: "var(--ink-faint)" }}>
                    Cliquez pour voir les détails
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(c.id, c.name);
                    }}
                    className="text-[12px] font-medium text-error hover:bg-error-soft rounded-lg px-3 py-1.5 transition-colors"
                  >
                    🗑 Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ajouter un membre à une classe */}
        <div className="mt-8">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
            Ajouter un membre à une classe
          </h3>
          <form
            className="flex gap-2.5 max-w-[720px]"
            onSubmit={handleAddMember}
          >
            <select
              name="classId"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <select
              name="userId"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none flex-1"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || "(sans nom)"} — {u.email || "—"} ({u.role})
                </option>
              ))}
            </select>
            <select
              name="memberRole"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            >
              <option value="student">Élève</option>
              <option value="teacher">Enseignant·e</option>
            </select>
            <button className="btn-primary btn-sm">Ajouter</button>
          </form>
        </div>
      </motion.div>
    </Shell>
  );
}
