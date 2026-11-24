import { NextResponse } from "next/server";
import { collections } from "@/lib/cloud/mongo";

/** Vérifie si un email est déjà associé à un compte (pour éviter les doublons à l'inscription). */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalized = (email ?? "").trim().toLowerCase();
    if (!normalized) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const { users } = collections();
    const existing = await users.findOne({ email: normalized }, { projection: { _id: 1 } });

    return NextResponse.json({ exists: !!existing });
  } catch {
    return NextResponse.json({ error: "Impossible de vérifier l'email" }, { status: 500 });
  }
}
