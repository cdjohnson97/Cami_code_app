"use client";

import { useRouter } from "next/navigation";

type Feature = {
  icon: string;
  title: string;
  desc: string;
  href?: string;
};

export function FeaturesSection() {
  const router = useRouter();
  const features: Feature[] = [
    {
      icon: "🎓",
      title: "Parcours d'apprentissage",
      desc: "4 parties (Algorithme, Python, Avancé, IA) et 109 exercices corrigés automatiquement, pas à pas.",
      href: "/carte",
    },
    {
      icon: "🐍",
      title: "Interpréteur dans le navigateur",
      desc: "Pseudocode et Python s'exécutent localement, sans serveur — tout fonctionne même hors-ligne.",
    },
    {
      icon: "🐰",
      title: "Mascotte CaMI",
      desc: "Une compagne animée qui vous encourage, célèbre vos réussites et vous guide tout au long du parcours.",
    },
    {
      icon: "🧪",
      title: "Bac à sable",
      desc: "Écrivez librement du pseudocode ou du Python pour expérimenter en dehors des exercices.",
      href: "/bac-a-sable",
    },
    {
      icon: "🏆",
      title: "Badges et certificat",
      desc: "Gagnez des badges à chaque étape et obtenez un certificat à la fin du parcours.",
      href: "/badges",
    },
    {
      icon: "🗺️",
      title: "Carte et glossaire",
      desc: "Naviguez visuellement entre les chapitres et consultez le lexique des termes de programmation.",
      href: "/carte",
    },
    {
      icon: "👤",
      title: "Comptes et synchronisation",
      desc: "Connectez-vous avec Google pour retrouver votre progression sur tous vos appareils (backend optionnel).",
    },
    {
      icon: "🏫",
      title: "Classes et suivi enseignant",
      desc: "Créez des classes, assignez des devoirs, publiez des annonces, créez des badges et exportez les résultats.",
      href: "/enseignant",
    },
    {
      icon: "📱",
      title: "Application installable (PWA)",
      desc: "Installez CaMI sur téléphone ou ordinateur, utilisez-la en plein écran et hors-ligne.",
    },
  ];

  return (
    <section className="mt-16 border-t pt-12" style={{ borderColor: "var(--line)" }}>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--ink)" }}>
          Ce que vous pouvez faire avec CaMI
        </h2>
        <p className="text-[14.5px] max-w-[60ch] mx-auto" style={{ color: "var(--ink-soft)" }}>
          Un parcours complet, en français, pour apprendre à coder et construire vos premières intelligences
          artificielles — à votre rythme, sans jargon.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            onClick={() => f.href && router.push(f.href)}
            className="group rounded-(--radius) border p-5 flex flex-col gap-3 cursor-pointer transition-colors hover:border-accent/50"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line)",
            }}
          >
            <span className="text-3xl">{f.icon}</span>
            <h3 className="font-semibold" style={{ color: "var(--ink)" }}>
              {f.title}
            </h3>
            <p className="text-[13px] leading-relaxed flex-1" style={{ color: "var(--ink-soft)" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
