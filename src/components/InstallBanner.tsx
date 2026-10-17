"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { promptInstall, useInstallState } from "@/lib/pwa";

const DISMISSED_KEY = "cami_install_banner_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Small "install the app" banner — phones only (hidden from md up), only when installation is
 * actually possible, and gone for good once closed (per device). Réglages keeps the full card.
 */
export function InstallBanner() {
  const { installed, canPrompt, ios } = useInstallState();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [showIosHelp, setShowIosHelp] = useState(false);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // storage unavailable: hidden for this visit only
    }
  }

  const visible = !installed && !dismissed && (canPrompt || ios);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          role="region"
          aria-label="Installer l'application"
          className="md:hidden fixed left-3 right-3 bottom-3 z-[90] rounded-2xl border px-4 py-3"
          style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
            <img src="/icons/icon-192.png" alt="" width={36} height={36} className="flex-none rounded-[9px]" />
            <div className="flex-1 min-w-0 text-[13.5px] leading-snug">
              <b>Installe CaMI</b>
              <span className="block" style={{ color: "var(--ink-soft)" }}>Sur ton écran d&apos;accueil, même sans connexion.</span>
            </div>
            {canPrompt ? (
              <button className="btn-primary btn-sm" onClick={() => void promptInstall()}>Installer</button>
            ) : (
              <button className="btn-primary btn-sm" onClick={() => setShowIosHelp((v) => !v)}>Comment ?</button>
            )}
            <button
              aria-label="Fermer"
              onClick={dismiss}
              className="flex-none w-8 h-8 rounded-full text-[15px] cursor-pointer border-none"
              style={{ background: "none", color: "var(--ink-faint)" }}
            >
              ✕
            </button>
          </div>
          {showIosHelp && (
            <p className="text-[13px] mt-2.5 mb-0" style={{ color: "var(--ink-soft)" }}>
              Touche <b>Partager</b> (le carré avec une flèche ↑) en bas de Safari, puis <b>« Sur l&apos;écran d&apos;accueil »</b>.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
