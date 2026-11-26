"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cloudEnabled } from "@/lib/cloud/config";
import { signOutSafely } from "@/lib/signOut";
import { PHASE_ORDER, CURRICULUM } from "@/lib/curriculum";
import { chapterDone, isChapterUnlocked, totalExerciseCount, completedCount } from "@/lib/progress";
import { BADGES } from "@/lib/progress";
import type { Chapter } from "@/lib/types";
import { AppLink } from "./AppLink";
import { useResolvedTheme } from "@/lib/theme";
import { useLoginGate } from "@/lib/loginGate";

const NAV_ITEMS: { id: string; icon: string; label: string }[] = [
  { id: "carte", icon: "🗺️", label: "Carte du voyage" },
  { id: "glossaire", icon: "📖", label: "Glossaire" },
  { id: "stats", icon: "📊", label: "Mes statistiques" },
  { id: "sandbox", icon: "🧪", label: "Bac à sable" },
  { id: "certificat", icon: "🎓", label: "Certificat" },
  { id: "reglages", icon: "⚙️", label: "Réglages" },
];

/** Door + arrow leaving it: the usual "log out" glyph, drawn inline to follow the text color. */
function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
      <path d="M10 16l4-4-4-4" />
      <path d="M14 12H4" />
    </svg>
  );
}

/** Sign-out row at the bottom of the side navigation — only for a signed-in learner. */
function SignOutItem({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");

  if (!cloudEnabled || !user) return null;

  async function handleSignOut() {
    setState("saving");
    const ok = await signOutSafely();
    if (!ok) {
      setState("failed");
      return;
    }
    onNavigate?.();
  }

  return (
    <div className="flex flex-col gap-0.5 pt-2 mt-1 border-t" style={{ borderColor: "var(--line)" }}>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={state === "saving"}
        title="Se déconnecter"
        className="flex items-center gap-2.5 w-full text-left px-2 py-2 rounded-[9px] text-[14.5px] cursor-pointer"
        style={{ color: state === "failed" ? "var(--error)" : "var(--ink-soft)", background: "none" }}
      >
        <span className="w-5 flex justify-center">
          <LogoutIcon />
        </span>
        <span>{state === "saving" ? "Déconnexion…" : "Se déconnecter"}</span>
      </button>
      {state === "failed" && (
        <p className="px-2 pb-1 text-xs leading-snug" style={{ color: "var(--error)" }}>
          Sauvegarde impossible. Réessaie quand le réseau revient.
        </p>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const route = useAppStore((s) => s.route);
  const completed = useAppStore((s) => s.completed);
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  const streak = useAppStore((s) => s.streak);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const gate = useLoginGate();

  const total = totalExerciseCount();
  const done = completedCount(completed);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex-none flex items-baseline gap-2 px-1 pt-1 pb-1.5 no-underline text-left cursor-pointer"
      >
        <AppLink
          to="home"
          onNavigate={onNavigate}
          aria-current={route.view === "home" ? "page" : undefined}
          className="flex items-baseline gap-2 px-1 pt-1 pb-1.5 no-underline text-left cursor-pointer"
        >
          <span className="font-mono text-[13px] font-semibold rounded-[6px] border-[1.5px] px-1.5 py-px" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>{"</>"}</span>
          <span className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>CaMI</span>
        </AppLink>
      </motion.div>

      <div className="flex-none rounded-xl border px-3.5 py-3" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        <div className="flex justify-between text-[12.5px] mb-1.5" style={{ color: "var(--ink-soft)" }}>
          <span>Progression</span><span>{done}/{total}</span>
        </div>
        <div className="h-[7px] rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>
      </div>

      <div className="flex-none flex items-center justify-between px-1 text-xs" style={{ color: "var(--ink-soft)" }}>
        <span>{streak > 0 ? `🔥 ${streak} jour${streak > 1 ? "s" : ""} de suite` : "Bienvenue !"}</span>
        <AppLink
          to="badges"
          onNavigate={onNavigate}
          aria-current={route.view === "badges" ? "page" : undefined}
          className="flex items-center gap-1.5 no-underline font-semibold px-1.5 py-0.5 rounded-md cursor-pointer"
          style={route.view === "badges" ? { color: "var(--accent)", background: "var(--accent-soft)" } : { color: "var(--ink-soft)" }}
        >
          🏅 {Object.keys(earnedBadges).length}/{BADGES.length}
        </AppLink>
      </div>

      <div className="flex-none flex gap-[3px] rounded-[10px] border p-1" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
        {(["auto", "light", "dark"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className="flex-1 rounded-[7px] py-1.5 text-[11px] font-semibold cursor-pointer"
            style={theme === t ? { background: "var(--accent-soft)", color: "var(--accent)" } : { color: "var(--ink-faint)", background: "none" }}
          >
            {t === "auto" ? "🖥 Auto" : t === "light" ? "☀️ Clair" : "🌙 Sombre"}
          </button>
        ))}
      </div>

      <nav className="flex flex-col gap-3.5">
        {PHASE_ORDER.map((pid) => {
          const phase = CURRICULUM[pid];
          return (
            <div key={pid}>
              <div className="text-[11px] tracking-wider uppercase font-bold px-2 mb-1.5" style={{ color: "var(--ink-faint)" }}>
                {phase.label} · {phase.shortLabel}
              </div>
              <div className="flex flex-col gap-0.5">
                {phase.chapters.map((ch: Chapter, ci: number) => {
                  const active = route.view === "chapter" && route.chapterId === ch.id;
                  const done2 = chapterDone(ch, completed);
                  const unlocked = isChapterUnlocked(ch.id, completed);
                  const className = "flex items-center gap-2.5 w-full text-left px-2 py-2 rounded-[9px] no-underline text-[14.5px] leading-snug";
                  const content = (
                    <>
                      <span
                        className="flex-none w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center text-[11px]"
                        style={
                          done2
                            ? { background: "var(--success)", borderColor: "var(--success)", color: "var(--paper)" }
                            : active
                            ? { borderColor: "var(--accent)", background: "var(--paper)" }
                            : { borderColor: "var(--line-strong)", background: "var(--paper)", color: "var(--ink-faint)" }
                        }
                      >
                        {done2 ? "✓" : !unlocked ? "🔒" : gate.mustSignIn(ch.id) ? "🔐" : ""}
                      </span>
                      <span>{ch.title}</span>
                    </>
                  );
                  // Locked chapters aren't links: nothing to open yet.
                  if (!unlocked) {
                    return (
                      <motion.span
                        key={ch.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.02, duration: 0.3 }}
                        aria-disabled="true"
                        className={className}
                        style={{ color: "var(--ink-faint)", cursor: "not-allowed" }}
                      >
                        {content}
                      </motion.span>
                    );
                  }
                  return (
                    <motion.div
                      key={ch.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ci * 0.02, duration: 0.3 }}
                      whileHover={{ y: -2 }}
                    >
                      <AppLink
                        to={ch.id}
                        onNavigate={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={className}
                        style={active ? { background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 } : { color: "var(--ink-soft)" }}
                      >
                        {content}
                      </AppLink>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex-none flex flex-col gap-0.5 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
        {NAV_ITEMS.map((item, ni) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + ni * 0.05, duration: 0.3 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AppLink
              to={item.id}
              onNavigate={onNavigate}
              aria-current={route.view === item.id ? "page" : undefined}
              className="flex items-center gap-2.5 w-full text-left px-2 py-2 rounded-[9px] no-underline text-[14.5px]"
              style={route.view === item.id ? { background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 } : { color: "var(--ink-soft)" }}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </AppLink>
          </motion.div>
        ))}
        <SignOutItem onNavigate={onNavigate} />
      </div>
    </>
  );
}

/** Top-bar shortcuts (phones), opposite the logo: light/dark switch + Réglages. */
function TopBarActions() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const route = useAppStore((s) => s.route);
  const shown = useResolvedTheme(theme);
  const next = shown === "dark" ? "light" : "dark";
  const buttonClass = "w-[38px] h-[38px] rounded-[9px] border flex items-center justify-center text-[17px] no-underline";
  const buttonStyle = { borderColor: "var(--line-strong)", background: "var(--paper)", color: "var(--ink)" };

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        aria-label={next === "dark" ? "Passer au thème sombre" : "Passer au thème clair"}
        title={next === "dark" ? "Thème sombre" : "Thème clair"}
        onClick={() => setTheme(next)}
        className={buttonClass}
        style={buttonStyle}
      >
        {shown === "dark" ? "☀️" : "🌙"}
      </button>
      <AppLink
        to="reglages"
        aria-label="Réglages"
        title="Réglages"
        aria-current={route.view === "reglages" ? "page" : undefined}
        className={buttonClass}
        style={route.view === "reglages" ? { ...buttonStyle, borderColor: "var(--accent)", background: "var(--accent-soft)" } : buttonStyle}
      >
        ⚙️
      </AppLink>
    </div>
  );
}

export function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <>
      <div className="md:hidden flex items-center gap-3 sticky top-0 z-[145] border-b px-4 py-3" style={{ background: "var(--sidebar)", borderColor: "var(--line)" }}>
        <button
          aria-label="Ouvrir le menu"
          onClick={() => setDrawerOpen(true)}
          className="w-[38px] h-[38px] rounded-[9px] border flex items-center justify-center text-lg"
          style={{ borderColor: "var(--line-strong)", background: "var(--paper)", color: "var(--ink)" }}
        >
          ☰
        </button>
        <span className="font-display text-base font-semibold">CaMI</span>
        <TopBarActions />
      </div>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[140]" style={{ background: "rgba(20,18,28,0.45)" }} onClick={() => setDrawerOpen(false)} />
      )}

      <aside
        className={`md:sticky md:top-0 md:h-screen md:translate-x-0 fixed top-0 left-0 h-screen z-[150] w-[min(84vw,320px)] transition-all duration-300 ease-out border-r flex flex-col gap-6 px-4 py-6 overflow-y-auto overflow-x-hidden overscroll-contain ${drawerOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "md:w-0 md:px-0 md:py-6 md:opacity-0 md:pointer-events-none md:overflow-hidden md:border-transparent" : "md:w-[272px] md:opacity-100"}`}
        style={{ background: "var(--sidebar)", borderColor: "var(--line)" }}
      >
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </aside>

      <motion.button
        aria-label={collapsed ? "Afficher le menu" : "Réduire le menu"}
        title={collapsed ? "Afficher le menu" : "Réduire le menu"}
        onClick={toggleSidebar}
        className="hidden md:flex items-center justify-center w-7 h-7 rounded-full border fixed top-6 z-[160] text-[12px] leading-none transition-[left] duration-300 ease-out cursor-pointer"
        animate={{ rotate: collapsed ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{
          left: collapsed ? "14px" : "258px",
          background: "var(--paper)",
          borderColor: "var(--line-strong)",
          color: "var(--ink-soft)",
          boxShadow: "var(--shadow)",
        }}
      >
        {collapsed ? "›" : "‹"}
      </motion.button>
    </>
  );
}
