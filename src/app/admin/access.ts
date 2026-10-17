import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";

export type AdminAccess = { ok: true } | { ok: false; message: string };

/**
 * Shared guard for every /admin page. The role is read from MongoDB on each request (not from
 * the session cookie), so removing someone's admin role takes effect immediately.
 */
export async function checkAdminAccess(): Promise<AdminAccess> {
  if (!cloudEnabled) {
    return { ok: false, message: "Le backend (MongoDB + connexion Google) n'est pas configuré pour ce projet — voir la section « Backend (optionnel) » du README pour l'activer." };
  }

  const userId = (await auth())?.user?.id;
  if (!userId || !ObjectId.isValid(userId)) {
    return { ok: false, message: "Connecte-toi d'abord depuis l'application (Réglages → Compte), puis reviens sur cette page." };
  }

  try {
    const me = await collections().users.findOne({ _id: new ObjectId(userId) }, { projection: { role: 1 } });
    if (me?.role !== "admin") {
      return { ok: false, message: "Cette page est réservée aux administrateurs. Si tu penses avoir accès, vérifie le champ « role » de ton compte dans MongoDB (collection users)." };
    }
  } catch {
    return { ok: false, message: "Impossible de joindre MongoDB pour le moment." };
  }
  return { ok: true };
}
