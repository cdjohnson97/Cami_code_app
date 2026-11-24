import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { checkAdminAccess } from "@/app/admin/access";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

// GET /api/classes/[id] — détail d'une classe avec ses membres (admin ou membre de la classe)
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!cloudEnabled) return error(403, "Backend non configuré");

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !ObjectId.isValid(userId)) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  const { users, classes } = collections();

  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");

  const me = await users.findOne({ _id: new ObjectId(userId) }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";

  // Seul l'admin, le teacherId, ou un membre peut voir le détail
  const isMember = cls.members?.some((m) => m.userId.toHexString() === userId);
  if (role !== "admin" && cls.teacherId.toHexString() !== userId && !isMember) {
    return error(403, "Accès refusé");
  }

  const memberIds = (cls.members ?? []).map((m) => m.userId);
  const memberDocs = await users.find({ _id: { $in: memberIds } }, { projection: { name: 1, email: 1, role: 1 } }).toArray();
  const membersById = new Map(memberDocs.map((u) => [u._id.toHexString(), u]));

  const members = (cls.members ?? []).map((m) => {
    const u = membersById.get(m.userId.toHexString());
    return {
      userId: m.userId.toHexString(),
      role: m.role,
      name: u?.name ?? null,
      email: u?.email ?? null,
    };
  });

  return Response.json({
    id: cls._id.toHexString(),
    code: cls.code,
    name: cls.name,
    teacherId: cls.teacherId.toHexString(),
    members,
  });
}

// DELETE /api/classes/[id] — supprimer une classe (admin uniquement)
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!cloudEnabled) return error(403, "Backend non configuré");

  const access = await checkAdminAccess();
  if (!access.ok) return error(403, access.message);

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  const { classes, users } = collections();

  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");

  // Retirer classId des élèves qui appartiennent à cette classe
  const studentIds = (cls.members ?? [])
    .filter((m) => m.role === "student")
    .map((m) => m.userId);

  if (studentIds.length > 0) {
    await users.updateMany(
      { _id: { $in: studentIds } },
      { $unset: { classId: "" } }
    );
  }

  await classes.deleteOne({ _id: new ObjectId(id) });
  return Response.json({ ok: true });
}

// PATCH /api/classes/[id] — mettre à jour les réglages d'une classe (codeExpiration, maxStudents)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!cloudEnabled) return error(403, "Backend non configuré");

  const access = await checkAdminAccess();
  if (!access.ok) return error(403, access.message);

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "JSON invalide");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return error(400, "Format invalide");

  const { classes } = collections();
  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");

  const updates: Record<string, unknown> = {};
  const b = body as Record<string, unknown>;

  if (b.codeExpiresAt !== undefined && b.codeExpiresAt !== null) {
    const d = new Date(b.codeExpiresAt as string);
    if (isNaN(d.getTime())) return error(400, "Date d'expiration invalide");
    updates.codeExpiresAt = d;
  } else if (b.codeExpiresAt === null) {
    updates.codeExpiresAt = null;
  }

  if (b.maxStudents !== undefined && b.maxStudents !== null) {
    const n = Number(b.maxStudents);
    if (!Number.isInteger(n) || n < 1) return error(400, "maxStudents doit être un entier positif");
    updates.maxStudents = n;
  } else if (b.maxStudents === null) {
    updates.maxStudents = null;
  }

  if (Object.keys(updates).length === 0) return error(400, "Aucun champ à modifier");

  await classes.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  return Response.json({ ok: true });
}
