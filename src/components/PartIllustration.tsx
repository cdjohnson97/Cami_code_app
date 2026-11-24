"use client";

import { motion } from "framer-motion";

export function PartIllustration({
  phaseId,
  size = 140,
  interactive = true,
}: {
  phaseId: string;
  size?: number;
  interactive?: boolean;
}) {
  switch (phaseId) {
    case "algo":
      return <AlgoIllustration size={size} interactive={interactive} />;
    case "python":
      return <PythonIllustration size={size} interactive={interactive} />;
    case "avance":
      return <AvanceIllustration size={size} interactive={interactive} />;
    case "ia":
      return <IAIllustration size={size} interactive={interactive} />;
    default:
      return null;
  }
}

/** 1. Algorithmique : CaMI résout un labyrinthe logique et connecte des blocs de puzzle */
function AlgoIllustration({ size, interactive }: { size: number; interactive: boolean }) {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.05, y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="inline-block select-none"
    >
      <svg viewBox="0 0 160 140" width={size} height={(size * 140) / 160} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="algo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="algo-path" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Halo doux de fond */}
        <ellipse cx="80" cy="70" rx="68" ry="56" fill="url(#algo-bg)" />

        {/* Labyrinthe / Circuit logique avec impulsion */}
        <path
          d="M 28 95 L 28 45 L 65 45 L 65 85 L 105 85 L 105 35 L 132 35"
          fill="none"
          stroke="rgba(59, 130, 246, 0.25)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Signal électrique animé qui parcourt le circuit */}
        <motion.path
          d="M 28 95 L 28 45 L 65 45 L 65 85 L 105 85 L 105 35 L 132 35"
          fill="none"
          stroke="url(#algo-path)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, pathOffset: 0 }}
          animate={{ pathLength: [0.15, 0.35, 0.15], pathOffset: [0, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />

        {/* Bloc puzzle 1 : "SI" */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="22" y="80" width="34" height="24" rx="6" fill="#3B82F6" />
          <text x="39" y="96" fill="#FFFFFF" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            SI
          </text>
        </motion.g>

        {/* Bloc puzzle 2 : "ALORS" */}
        <motion.g
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <rect x="85" y="70" width="46" height="24" rx="6" fill="#2563EB" />
          <text x="108" y="86" fill="#FFFFFF" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            ALORS
          </text>
        </motion.g>

        {/* Petit CaMI au centre qui guide le flux */}
        <g transform="translate(68, 30)">
          <rect x="-12" y="-14" width="24" height="26" rx="10" fill="var(--m-body)" />
          <line x1="0" y1="-14" x2="0" y2="-19" stroke="var(--m-body)" strokeWidth="2" />
          <circle cx="0" cy="-21" r="2.5" fill="#3B82F6" />
          <circle cx="-4" cy="-3" r="2.2" fill="var(--m-eye)" />
          <circle cx="4" cy="-3" r="2.2" fill="var(--m-eye)" />
          <path d="M -4 4 Q 0 8 4 4" stroke="var(--m-eye)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>

        {/* Étoile de réussite à la sortie */}
        <motion.path
          d="M 132 30 L 134 35 L 139 35.5 L 135 39 L 136 44 L 132 41.5 L 128 44 L 129 39 L 125 35.5 L 130 35 Z"
          fill="#FACC15"
          animate={{ scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}

/** 2. Python : Un petit serpent Python amical et stylisé qui s'enroule autour de l'ordinateur */
function PythonIllustration({ size, interactive }: { size: number; interactive: boolean }) {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.05, y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="inline-block select-none"
    >
      <svg viewBox="0 0 160 140" width={size} height={(size * 140) / 160} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="py-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="py-snake" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Fond lumineux */}
        <ellipse cx="80" cy="70" rx="68" ry="56" fill="url(#py-bg)" />

        {/* Écran d'ordinateur portable */}
        <rect x="42" y="38" width="76" height="52" rx="7" fill="#1E293B" stroke="#334155" strokeWidth="2" />
        <rect x="47" y="43" width="66" height="42" rx="4" fill="#0F172A" />
        <rect x="34" y="90" width="92" height="6" rx="3" fill="#475569" />

        {/* Lignes de code fluo sur l'écran */}
        <rect x="52" y="49" width="22" height="3" rx="1.5" fill="#38BDF8" />
        <rect x="78" y="49" width="16" height="3" rx="1.5" fill="#F472B6" />
        <rect x="56" y="56" width="34" height="3" rx="1.5" fill="#A7F3D0" />
        <rect x="56" y="63" width="28" height="3" rx="1.5" fill="#FDE047" />

        {/* Petit python amical qui ondoie au-dessus de l'écran */}
        <motion.path
          d="M 34 85 C 30 65, 45 32, 70 32 C 92 32, 108 42, 118 42 C 128 42, 134 50, 132 60 C 130 70, 116 75, 116 88"
          fill="none"
          stroke="url(#py-snake)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{
            d: [
              "M 34 85 C 30 65, 45 32, 70 32 C 92 32, 108 42, 118 42 C 128 42, 134 50, 132 60 C 130 70, 116 75, 116 88",
              "M 34 85 C 30 68, 48 35, 70 35 C 90 35, 106 39, 118 44 C 128 44, 136 53, 131 63 C 127 72, 118 76, 118 88",
              "M 34 85 C 30 65, 45 32, 70 32 C 92 32, 108 42, 118 42 C 128 42, 134 50, 132 60 C 130 70, 116 75, 116 88",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Tête mignonne du serpent python */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="34" cy="85" r="7.5" fill="#10B981" />
          <circle cx="32" cy="83" r="2" fill="#0F172A" />
          <circle cx="31.5" cy="82.5" r="0.7" fill="#FFFFFF" />
          {/* Petite langue amicale */}
          <motion.path
            d="M 27 88 L 22 91 L 19 89 M 22 91 L 20 94"
            stroke="#F43F5E"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            animate={{ scaleX: [0.5, 1.2, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.g>

        {/* Mascotte CaMI qui observe joyeusement depuis le côté droit */}
        <g transform="translate(136, 85)">
          <rect x="-9" y="-12" width="18" height="20" rx="7" fill="var(--m-body)" />
          <circle cx="-3" cy="-3" r="1.8" fill="var(--m-eye)" />
          <circle cx="3" cy="-3" r="1.8" fill="var(--m-eye)" />
          <path d="M -3 3 Q 0 6 3 3" stroke="var(--m-eye)" strokeWidth="1.2" fill="none" />
        </g>
      </svg>
    </motion.div>
  );
}

/** 3. Python Avancé : L'atelier d'ingénieur avec engrenages synchronisés et objets modulaires */
function AvanceIllustration({ size, interactive }: { size: number; interactive: boolean }) {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.05, y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="inline-block select-none"
    >
      <svg viewBox="0 0 160 140" width={size} height={(size * 140) / 160} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="av-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="70" rx="68" ry="56" fill="url(#av-bg)" />

        {/* Grand engrenage violet qui tourne */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "52px 64px" }}
        >
          <circle cx="52" cy="64" r="24" fill="#8B5CF6" />
          <circle cx="52" cy="64" r="10" fill="#F3EFE7" />
          {/* Dents */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect
              key={angle}
              x="48"
              y="35"
              width="8"
              height="8"
              rx="2"
              fill="#8B5CF6"
              transform={`rotate(${angle} 52 64)`}
            />
          ))}
        </motion.g>

        {/* Petit engrenage ambre synchronisé en sens inverse */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 10.6, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "96px 48px" }}
        >
          <circle cx="96" cy="48" r="16" fill="#F59E0B" />
          <circle cx="96" cy="48" r="7" fill="#F3EFE7" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <rect
              key={angle}
              x="93"
              y="28"
              width="6"
              height="6"
              rx="1.5"
              fill="#F59E0B"
              transform={`rotate(${angle} 96 48)`}
            />
          ))}
        </motion.g>

        {/* CaMI ingénieur au premier plan avec casque & clé */}
        <g transform="translate(108, 92)">
          {/* Corps CaMI */}
          <rect x="-14" y="-16" width="28" height="30" rx="11" fill="var(--m-body)" />
          {/* Petit casque de chantier violet */}
          <path d="M -16 -16 C -16 -24, 16 -24, 16 -16 Z" fill="#8B5CF6" />
          <rect x="-17" y="-17" width="34" height="3.5" rx="1.5" fill="#7C3AED" />
          {/* Yeux concentrés */}
          <circle cx="-5" cy="-6" r="2.4" fill="var(--m-eye)" />
          <circle cx="5" cy="-6" r="2.4" fill="var(--m-eye)" />
          <path d="M -5 3 Q 0 8 5 3" stroke="var(--m-eye)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* Clé à molette tenue dans la main */}
          <line x1="-16" y1="-2" x2="-26" y2="-12" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-27" cy="-13" r="3.5" stroke="#64748B" strokeWidth="2.5" fill="none" />
        </g>
      </svg>
    </motion.div>
  );
}

/** 4. Intelligence Artificielle : CaMI en apesanteur dans un réseau neuronal galactique */
function IAIllustration({ size, interactive }: { size: number; interactive: boolean }) {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.05, y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="inline-block select-none"
    >
      <svg viewBox="0 0 160 140" width={size} height={(size * 140) / 160} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ia-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="70" rx="68" ry="56" fill="url(#ia-bg)" />

        {/* Lignes de synapses neuronales */}
        <g stroke="rgba(236, 72, 153, 0.35)" strokeWidth="1.8" strokeDasharray="3 3">
          <line x1="28" y1="42" x2="65" y2="35" />
          <line x1="28" y1="42" x2="52" y2="82" />
          <line x1="65" y1="35" x2="105" y2="45" />
          <line x1="52" y1="82" x2="105" y2="45" />
          <line x1="105" y1="45" x2="136" y2="75" />
          <line x1="52" y1="82" x2="120" y2="102" />
          <line x1="120" y1="102" x2="136" y2="75" />
        </g>

        {/* Impulsions synaptiques lumineuses */}
        {[
          { cx: 28, cy: 42, delay: 0 },
          { cx: 65, cy: 35, delay: 0.6 },
          { cx: 52, cy: 82, delay: 1.2 },
          { cx: 105, cy: 45, delay: 0.3 },
          { cx: 120, cy: 102, delay: 0.9 },
          { cx: 136, cy: 75, delay: 1.5 },
        ].map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r="4.5"
            fill="#EC4899"
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, delay: node.delay, ease: "easeInOut" }}
          />
        ))}

        {/* CaMI flottant en apesanteur au centre avec petite visière spatiale */}
        <motion.g
          animate={{ y: [0, -6, 0], rotate: [-2, 3, -2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          transform="translate(80, 68)"
        >
          {/* Halo d'apesanteur */}
          <circle cx="0" cy="0" r="25" fill="rgba(236, 72, 153, 0.12)" />

          {/* Corps CaMI */}
          <rect x="-15" y="-16" width="30" height="32" rx="12" fill="var(--m-body)" />

          {/* Antenne stellaire */}
          <line x1="0" y1="-16" x2="0" y2="-22" stroke="var(--m-body)" strokeWidth="2.5" />
          <motion.circle
            cx="0"
            cy="-24"
            r="3.5"
            fill="#EC4899"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Yeux émerveillés */}
          <circle cx="-5" cy="-5" r="2.8" fill="var(--m-eye)" />
          <circle cx="5" cy="-5" r="2.8" fill="var(--m-eye)" />
          <circle cx="-4.5" cy="-5.8" r="0.9" fill="#FFFFFF" />
          <circle cx="5.5" cy="-5.8" r="0.9" fill="#FFFFFF" />

          {/* Sourire béat */}
          <path d="M -5 4 Q 0 9 5 4" stroke="var(--m-eye)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
