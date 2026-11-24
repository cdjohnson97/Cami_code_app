"use client";

import { useEffect, useState } from "react";
import SweetAlert from "sweetalert2";
import { useAppStore } from "@/store/useAppStore";
import { cloudEnabled } from "@/lib/cloud/config";
import { AccountCard } from "./AccountCard";
import { InstallCard } from "./InstallCard";
import { GenderChoice } from "./GenderChoice";
import { accord } from "@/lib/genre";

type MyClass = { id: string; code: string; name: string } | null;

export function SettingsPage() {
  const name = useAppStore((s) => s.name);
  const setName = useAppStore((s) => s.setName);
  const setClassId = useAppStore((s) => s.setClassId);
  const gender = useAppStore((s) => s.gender);
  const setGender = useAppStore((s) => s.setGender);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const soundOn = useAppStore((s) => s.soundOn);
  const setSoundOn = useAppStore((s) => s.setSoundOn);
  const resetProgress = useAppStore((s) => s.resetProgress);

  const [draft, setDraft] = useState(name || "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [myClass, setMyClass] = useState<MyClass>(null);
  const [teacherClasses, setTeacherClasses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [classMsg, setClassMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!cloudEnabled) return;
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then(async (data) => {
        if (cancelled) return;
        setRole(data?.role ?? null);
        if (data?.preferences?.classId) {
          const r2 = await fetch("/api/classes");
          if (r2.ok) {
            const d = await r2.json();
            setMyClass(d.class ?? null);
          }
        }
      })
      .catch(() => {});

    if (role === "teacher" || role === "admin") {
      fetch("/api/classes")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (cancelled) return;
          setTeacherClasses(data?.classes ?? []);
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [cloudEnabled, role]);

  async function handleCreateClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    if (!name) return;
    setCreating(true);
    setClassMsg(null);
    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name }),
    });
    const data = await r.json();
    setCreating(false);
    if (r.ok) {
      setTeacherClasses((prev) => [...prev, data.class]);
      setClassMsg({ kind: "ok", text: `Classe créée. Code d'invitation : ${data.class.code} — partage-le avec tes élèves.` });
    } else {
      setClassMsg({ kind: "error", text: data.error ?? "Impossible de créer la classe." });
    }
  }

  async function handleJoinClass() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setClassMsg(null);
    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code: joinCode }),
    });
    const data = await r.json();
    setJoining(false);
    if (r.ok) {
      setClassId(data.class.id);
      setMyClass(data.class);
      setJoinCode("");
      setClassMsg({ kind: "ok", text: `Tu as rejoint la classe « ${data.class.name} ».` });
    } else {
      setClassMsg({ kind: "error", text: data.error ?? "Code invalide." });
    }
  }

  return (
    <div>
      <h1 className="text-2xl mb-7">Réglages</h1>

      {process.env.NODE_ENV === "development" && !cloudEnabled && (
        <div
          className="rounded-(--radius) border px-6 py-4 max-w-[640px] mb-5"
          style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
        >
          <h3 className="text-base mb-1" style={{ color: "var(--warn-ink)" }}>Backend non configuré (développement)</h3>
          <p className="text-[13.5px] leading-relaxed m-0" style={{ color: "var(--warn-ink)" }}>
            La carte Compte et la connexion Google sont masquées parce que <code>.env.local</code> est absent ou
            incomplet. Lance <code>npm run doctor</code> pour voir ce qui manque, puis redémarre{" "}
            <code>npm run dev</code>.
          </p>
        </div>
      )}

      <AccountCard />
      <InstallCard />

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <h3 className="text-base mb-1.5">Ton prénom</h3>
        <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>Utilisé pour personnaliser les messages et le certificat.</p>
        <div className="flex gap-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ton prénom"
            className="rounded-[9px] border px-3 py-2 text-[14.5px] outline-none flex-1 max-w-[240px]"
            style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
          />
          <button className="btn-primary btn-sm" onClick={() => setName(draft.trim() || null)}>Enregistrer</button>
        </div>
        <p className="text-[13.5px] mt-4 mb-2" style={{ color: "var(--ink-soft)" }}>Comment veux-tu que l&apos;appli s&apos;adresse à toi ?</p>
        <GenderChoice value={gender} onChange={setGender} />
      </div>

      {cloudEnabled && (role === "teacher" || role === "admin") && (
        <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
          <h3 className="text-base mb-1.5">Mes classes {role === "admin" ? "(administrateur·trice)" : "(enseignant·e)"}</h3>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>Créez une classe et donnez son code d&apos;invitation à vos élèves pour qu&apos;ils vous rejoignent.</p>
          <form onSubmit={handleCreateClass} className="flex gap-2.5 mb-4">
            <input
              name="name"
              placeholder="Nom de la classe"
              className="rounded-[9px] border px-3 py-2 text-[14.5px] outline-none flex-1 max-w-[240px]"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            />
            <button className="btn-primary btn-sm" disabled={creating}>
              {creating ? "Création…" : "Créer la classe"}
            </button>
          </form>
          {classMsg && (
            <p className="text-[13px] mb-3" style={{ color: classMsg.kind === "ok" ? "var(--success)" : "var(--error)" }}>
              {classMsg.text}
            </p>
          )}
          {teacherClasses.length === 0 ? (
            <p className="text-[13.5px]" style={{ color: "var(--ink-faint)" }}>Aucune classe pour l&apos;instant.</p>
          ) : (
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left" style={{ borderColor: "var(--line)", color: "var(--ink-soft)", fontWeight: 600 }}>Classe</th>
                  <th className="px-4 py-3 text-left" style={{ borderColor: "var(--line)", color: "var(--ink-soft)", fontWeight: 600 }}>Code d&apos;invitation</th>
                </tr>
              </thead>
              <tbody>
                {teacherClasses.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--accent)" }}>{c.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {cloudEnabled && (role === "teacher" || role === "admin") && teacherClasses.length > 0 && (
        <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
          <h3 className="text-base mb-1.5">Réglages de classe</h3>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
            Configurez l&apos;expiration du code d&apos;invitation et le nombre maximal d&apos;élèves pour une classe.
          </p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const classId = formData.get("classId") as string;
              const expiresAt = (formData.get("expiresAt") as string) || undefined;
              const maxStudents = (formData.get("maxStudents") as string) || undefined;
              const body: Record<string, unknown> = {};
              if (expiresAt !== undefined) body.codeExpiresAt = expiresAt;
              if (maxStudents !== undefined) body.maxStudents = maxStudents === "" ? null : maxStudents;
              fetch(`/api/classes/${classId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }).then(async (r) => {
                if (r.ok) {
                  SweetAlert.fire({ icon: "success", title: "Réglages mis à jour", timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
                } else {
                  const d = await r.json().catch(() => ({}));
                  SweetAlert.fire({ icon: "error", title: "Erreur", text: d.error ?? "Impossible de mettre à jour" });
                }
              });
            }}
          >
            <select
              name="classId"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none w-full"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <input
              name="expiresAt"
              type="datetime-local"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              placeholder="Date d'expiration du code"
            />
            <input
              name="maxStudents"
              type="number"
              min="1"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none w-[120px]"
              style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
              placeholder="Max élèves"
            />
            <button className="btn-primary btn-sm">Enregistrer</button>
          </form>
        </div>
      )}

      {cloudEnabled && role !== "teacher" && role !== "admin" && (
        <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
          <h3 className="text-base mb-1.5">Ma classe</h3>
          {myClass ? (
            <>
              <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
                Tu es inscrit·e dans la classe <strong style={{ color: "var(--ink)" }}>{myClass.name}</strong> (code {myClass.code}).
              </p>
            </>
          ) : (
            <>
              <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
                Un·e enseignant·e peut t&apos;inviter dans sa classe avec un code à 6 caractères. Saisis-le ici pour rejoindre sa classe et apparaître dans son tableau de bord.
              </p>
              <div className="flex gap-2.5">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="rounded-[9px] border px-3 py-2 text-[14.5px] outline-none flex-1 max-w-[200px] text-uppercase"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
                />
                <button className="btn-primary btn-sm" disabled={joining || !joinCode.trim()} onClick={handleJoinClass}>
                  {joining ? "Rejoindre…" : "Rejoindre la classe"}
                </button>
              </div>
              {classMsg && (
                <p className="text-[13px] mt-3" style={{ color: classMsg.kind === "ok" ? "var(--success)" : "var(--error)" }}>
                  {classMsg.text}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <h3 className="text-base mb-3">Thème</h3>
        <div className="flex gap-2 flex-wrap">
          {(["auto", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="rounded-lg border px-3.5 py-2 text-[13.5px]"
              style={theme === t ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)", fontWeight: 600 } : { borderColor: "var(--line-strong)", color: "var(--ink-soft)", background: "var(--bg)" }}
            >
              {t === "auto" ? "🖥 Automatique" : t === "light" ? "☀️ Clair" : "🌙 Sombre"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <h3 className="text-base mb-1.5">Sons</h3>
        <label className="flex items-center gap-2 text-[13.5px] cursor-pointer" style={{ color: "var(--ink-soft)" }}>
          <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
          Activer les sons de réussite
        </label>
      </div>

      <div className="rounded-(--radius) border px-6 py-5 max-w-[640px]" style={{ background: "var(--paper)", borderColor: "var(--error)" }}>
        <h3 className="text-base mb-1.5">Réinitialiser la progression</h3>
        <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>Efface tout ton avancement, tes badges et ton certificat. Irréversible.</p>
        {!confirmReset ? (
          <button className="btn-ghost btn-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }} onClick={() => setConfirmReset(true)}>
            Réinitialiser tout
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="text-[13.5px]" style={{ color: "var(--error)" }}>Tu es {accord(gender, "sûr", "sûre", "sûr·e")} ?</span>
            <button className="btn-primary btn-sm" style={{ background: "var(--error)" }} onClick={() => { resetProgress(); setConfirmReset(false); }}>Oui, tout effacer</button>
            <button className="btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}
