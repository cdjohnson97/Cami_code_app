"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { findChapterEntry } from "@/lib/progress";
import { MAP_ICONS } from "@/lib/curriculum";
import { PART_META } from "@/lib/partMeta";
import { Mascot } from "./Mascot";

/** Plays a short "CaMI travels to the next chapter" animation whenever the store's
 * `travelAnimation` token changes — set by goTo() when moving from one chapter to another. */
export function ChapterTravelOverlay() {
  const travel = useAppStore((s) => s.travelAnimation);
  const clearTravelAnimation = useAppStore((s) => s.clearTravelAnimation);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Switches from "walking in" to "waving hello" once the mascot has reached the badge.
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!travel) return;
    const delay = reducedMotion ? 150 : 1700;
    const t = window.setTimeout(() => clearTravelAnimation(), delay);
    return () => window.clearTimeout(t);
  }, [travel, reducedMotion, clearTravelAnimation]);

  useEffect(() => {
    if (!travel) {
      setArrived(false);
      return;
    }
    if (reducedMotion) {
      setArrived(true);
      return;
    }
    const t = window.setTimeout(() => setArrived(true), 1000);
    return () => window.clearTimeout(t);
  }, [travel, reducedMotion]);

  const entry = travel ? findChapterEntry(travel.toChapterId) : null;
  const icon = travel ? MAP_ICONS[travel.toChapterId] || "📍" : "📍";
  const title = entry?.chapter.title || "";
  const partLabel = entry?.phase.shortLabel || "";
  const meta = entry ? PART_META[entry.phase.id] : null;
  const accent = meta?.color || "var(--accent)";
  const accentSoft = meta?.soft || "var(--accent-soft)";

  return (
    // AnimatePresence needs to stay mounted across the travel -> null transition for the exit
    // fade below to actually play — returning null higher up (outside AnimatePresence) would
    // unmount everything at once instead, making the overlay vanish with a hard cut.
    <AnimatePresence>
      {travel && (
        <motion.div
          key={travel.token}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[180] flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 65% 55% at 50% 48%, ${accentSoft} 0%, transparent 68%), color-mix(in srgb, var(--bg) 94%, transparent)`,
          }}
          aria-hidden="true"
        >
          {/* the path the mascot just walked: little sparks lighting up in sequence behind it */}
          <div className="absolute left-[7%] right-1/2 top-[42%] flex justify-between">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accent }}
                initial={{ opacity: 0.12, scale: 0.5 }}
                animate={{ opacity: [0.12, 1, 0.12], scale: [0.5, 1.2, 0.5] }}
                transition={{
                  duration: reducedMotion ? 0.1 : 0.9,
                  delay: reducedMotion ? 0 : 0.1 + (i / 5) * 0.95,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* CaMI walks in from the left, then stops and waves at the destination */}
          <motion.div
            className="absolute"
            initial={{ left: "6%", top: "42%" }}
            animate={{ left: "50%", top: "42%" }}
            transition={{ duration: reducedMotion ? 0.1 : 1, ease: [0.33, 0, 0.2, 1] }}
            style={{ x: "-50%", y: "-50%" }}
          >
            <Mascot
              mood={arrived ? "wave" : "happy"}
              size={120}
              interactive={false}
              variant="3d"
              walking={!arrived && !reducedMotion}
            />
          </motion.div>

          {/* destination badge: pops in with a spring once the mascot has mostly arrived, with a
              soft pulsing glow in the destination part's own accent color */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.9, duration: 0.5, type: "spring", stiffness: 260, damping: 17 }}
            className="absolute bottom-[20%] flex flex-col items-center gap-2 text-center px-4"
          >
            <motion.span
              className="flex items-center justify-center w-16 h-16 rounded-full text-3xl"
              style={{ background: accentSoft }}
              animate={{
                boxShadow: reducedMotion
                  ? `0 0 0 0px color-mix(in srgb, ${accent} 0%, transparent)`
                  : [
                      `0 0 0 0px color-mix(in srgb, ${accent} 35%, transparent)`,
                      `0 0 0 14px color-mix(in srgb, ${accent} 0%, transparent)`,
                    ],
              }}
              transition={{ delay: reducedMotion ? 0 : 1, duration: 1.1, repeat: reducedMotion ? 0 : Infinity, ease: "easeOut" }}
            >
              {icon}
            </motion.span>
            <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>{partLabel}</span>
            <span className="font-display text-lg font-semibold" style={{ color: "var(--ink)" }}>{title}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
