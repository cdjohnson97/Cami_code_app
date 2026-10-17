"use client";

import { useState } from "react";
import { promptInstall, useInstallState } from "@/lib/pwa";

/** Réglages → "Application": install CaMI on this device, whatever the browser. */
export function InstallCard() {
  const { installed, canPrompt, ios } = useInstallState();
  const [declined, setDeclined] = useState(false);

  return (
    <div className="rounded-(--radius) border px-6 py-5 max-w-[640px] mb-5" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      <h3 className="text-base mb-1.5">Application</h3>
      {installed ? (
        <p className="text-[13.5px]" style={{ color: "var(--success-ink)" }}>
          ✓ CaMI est installée sur cet appareil. Elle fonctionne aussi sans connexion.
        </p>
      ) : (
        <>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--ink-soft)" }}>
            Installe CaMI comme une application : une icône sur ton écran d&apos;accueil, en plein écran, et
            utilisable même sans connexion.
          </p>
          {canPrompt ? (
            <>
              <button
                className="btn-primary btn-sm"
                onClick={async () => setDeclined(!(await promptInstall()))}
              >
                📲 Installer l&apos;application
              </button>
              {declined && (
                <p className="text-xs mt-2" style={{ color: "var(--ink-faint)" }}>
                  Pas de souci — tu pourras l&apos;installer plus tard depuis le menu du navigateur.
                </p>
              )}
            </>
          ) : ios ? (
            <p className="text-[13.5px]" style={{ color: "var(--ink-soft)" }}>
              Sur iPhone / iPad : touche le bouton <b>Partager</b> (le carré avec une flèche ↑) en bas de Safari, puis{" "}
              <b>« Sur l&apos;écran d&apos;accueil »</b>.
            </p>
          ) : (
            <p className="text-[13.5px]" style={{ color: "var(--ink-soft)" }}>
              Ouvre le menu du navigateur (<b>⋮</b>) et choisis <b>« Installer l&apos;application »</b> ou{" "}
              <b>« Ajouter à l&apos;écran d&apos;accueil »</b>. Sur ordinateur, l&apos;icône d&apos;installation se trouve
              aussi au bout de la barre d&apos;adresse.
            </p>
          )}
        </>
      )}
    </div>
  );
}
