import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

async function currentUser() {
  if (!cloudEnabled) return null;
  const session = await auth();
  const id = session?.user?.id;
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// GET /api/devoirs/[id] — détail d'un devoir
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de devoir invalide");

  const { users, classes, devoirs } = collections();
  const devoir = await devoirs.findOne({ _id: new ObjectId(id) });
  if (!devoir) return error(404, "Devoir introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";

  const cls = await classes.findOne({ _id: devoir.classId });
  if (!cls) return error(404, "Classe introuvable");

  // Autorisation: admin, ou teacher de la classe, ou élève de la classe
  if (role !== "admin" && cls.teacherId.toHexString() !== userId.toHexString() && me?.classId?.toHexString() !== devoir.classId.toHexString()) {
    return error(403, "Accès refusé");
  }

  return Response.json({
    id: devoir._id.toHexString(),
    classId: devoir.classId.toHexString(),
    exerciseId: devoir.exerciseId,
    title: devoir.title,
    dueDate: devoir.dueDate?.toISOString() ?? null,
    createdBy: devoir.createdBy.toHexString(),
    createdAt: devoir.createdAt.toISOString(),
  });
}

// DELETE /api/devoirs/[id] — supprimer un devoir (admin ou teacher de la classe)
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de devoir invalide");

  const { users, classes, devoirs, devoirsSoumis } = collections();
  const devoir = await devoirs.findOne({ _id: new ObjectId(id) });
  if (!devoir) return error(404, "Devoir introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1 } });
  const role = me?.role ?? "student";
  const cls = await classes.findOne({ _id: devoir.classId });

  if (role !== "admin" && cls?.teacherId.toHexString() !== userId.toHexString()) {
    return error(403, "Accès refusé");
  }

  await devoirs.deleteOne({ _id: new ObjectId(id) });
  await devoirsSoumis.deleteMany({ devoirId: new ObjectId(id) });
  return Response.json({ ok: true });
}

// PATCH /api/devoirs/[id] — modifier un devoir
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de devoir invalide");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "JSON invalide");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return error(400, "Format invalide");

  const { users, classes, devoirs } = collections();
  const devoir = await devoirs.findOne({ _id: new ObjectId(id) });
  if (!devoir) return error(404, "Devoir introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1 } });
  const role = me?.role ?? "student";
  const cls = await classes.findOne({ _id: devoir.classId });

  if (role !== "admin" && cls?.teacherId.toHexString() !== userId.toHexString()) {
    return error(403, "Accès refusé");
  }

  const updates: Record<string, unknown> = {};
  const b = body as Record<string, unknown>;
  if (typeof b.title === "string") updates.title = b.title.trim();
  if (b.dueDate !== undefined) updates.dueDate = b.dueDate ? new Date(b.dueDate as string) : null;
  if (typeof b.exerciseId === "string") updates.exerciseId = b.exerciseId;

  if (Object.keys(updates).length === 0) return error(400, "Aucun champ à modifier");

  await devoirs.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  return Response.json({ ok: true });
}
