#!/usr/bin/env node
/**
 * Verifie la configuration du backend CaMI avant `npm run dev` (script `predev`),
 * ou en detail avec `npm run doctor` (ajoute un ping MongoDB).
 *
 * Pourquoi ce script : sans `.env.local`, l'app masque volontairement la carte
 * "Compte" et le mur de connexion (cloudEnabled = false). C'est un echec
 * silencieux : on croit a une regression alors qu'il manque juste un fichier
 * ignore par git. Le script rend ce cas visible au demarrage.
 *
 * Il n'affiche jamais les valeurs, seulement leur presence.
 * Il ne fait jamais echouer `npm run dev` : sans backend, l'app reste utilisable.
 * Seul `npm run doctor` sort en erreur (code 1) si quelque chose manque ou si
 * MongoDB ne repond pas.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env.local");
const REQUIRED = ["MONGODB_URI", "AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"];
const PING = process.argv.includes("--ping");

/** Parse minimal de fichier .env (KEY=VALUE, commentaires, guillemets). */
function parseEnvFile(path) {
  const vars = {};
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[match[1]] = value;
  }
  return vars;
}

const fileExists = existsSync(ENV_FILE);
const fileVars = fileExists ? parseEnvFile(ENV_FILE) : {};

// Une variable d'environnement reelle (Docker, CI, shell) a priorite sur le fichier.
const get = (key) => process.env[key] || fileVars[key] || "";

const flagForced = process.env.CAMI_CLOUD_ENABLED === "true";
const missing = REQUIRED.filter((key) => !get(key));
const active = flagForced || missing.length === 0;

console.log("");
console.log("CaMI - configuration du backend");
console.log("");
console.log(`  .env.local${" ".repeat(9)}: ${fileExists ? "present" : "ABSENT"}`);
for (const key of REQUIRED) {
  console.log(`  ${key.padEnd(19)}: ${get(key) ? "OK" : "MANQUANT"}`);
}
console.log("");

if (active) {
  console.log("  Backend      : ACTIF (comptes Google + synchronisation MongoDB)");
} else {
  console.log("  Backend      : DESACTIVE (comptes et connexion masques)");
  console.log(`  Manque       : ${missing.join(", ")}`);
  console.log("");
  console.log("  Pour l'activer : copier .env.local.example vers .env.local et remplir les");
  console.log("  4 variables (voir README, section Backend), puis redemarrer npm run dev.");
}

if (flagForced && !active) {
  console.log("");
  console.log("  ATTENTION : CAMI_CLOUD_ENABLED=true est force mais des variables manquent.");
  console.log("  La connexion echouera au premier appel : completez .env.local.");
}

if (!PING) {
  console.log("");
  process.exit(0);
}

console.log("");
if (!active) {
  console.log("  MongoDB      : non teste (backend desactive)");
  console.log("");
  process.exitCode = 1;
} else {
  const dbName = get("MONGODB_DB") || "cami";
  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(get("MONGODB_URI"), { serverSelectionTimeoutMS: 8000 });
    try {
      await client.connect();
      await client.db(dbName).command({ ping: 1 });
      console.log(`  MongoDB      : OK (base "${dbName}")`);
    } finally {
      await client.close().catch(() => {});
    }
  } catch (error) {
    console.log(`  MongoDB      : ECHEC - ${error instanceof Error ? error.message : String(error)}`);
    console.log("");
    console.log("  Verifier MONGODB_URI et l'acces reseau (Atlas : IP autorisee).");
    process.exitCode = 1;
  }
  console.log("");
}
