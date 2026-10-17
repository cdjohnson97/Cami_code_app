import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest): what makes CaMI installable on a phone's
// home screen / as a desktop app. Icons are generated from the "</>" logo (public/icons/).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CaMI — apprendre à coder et découvrir l'IA",
    short_name: "CaMI",
    description:
      "Un parcours pas à pas pour apprendre la logique de la programmation, du pseudocode jusqu'à Python et l'intelligence artificielle.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F3EFE7",
    theme_color: "#F3EFE7",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
