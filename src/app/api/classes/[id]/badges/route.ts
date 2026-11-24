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

// GET /api/classes/[id]/badges — badges d'une classe
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  const { users, classes, classBadges } = collections();
  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";

  if (role !== "admin" && cls.teacherId.toHexString() !== userId.toHexString() && me?.classId?.toHexString() !== id) {
    return error(403, "Accès refusé");
  }

  const docs = await classBadges.find({ classId: new ObjectId(id) }).sort({ createdAt: -1 }).toArray();
  return Response.json({
    badges: docs.map((b) => ({
      id: b._id.toHexString(),
      name: b.name,
      description: b.description,
      icon: b.icon,
      createdBy: b.createdBy.toHexString(),
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

// POST /api/classes/[id]/badges — créer un badge de classe (enseignant/admin)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  const { users, classes, classBadges } = collections();
  const me = await users.findOne({ _id: userId }, { projection: { role: 1 } });
  const role = me?.role ?? "student";
  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");
  if (role !== "admin" && cls.teacherId.toHexString() !== userId.toHexString()) {
    return error(403, "Vous n'êtes pas l'enseignant de cette classe");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "JSON invalide");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return error(400, "Format invalide");

  const { name, description, icon } = body as { name: string; description: string; icon: string };
  if (!name || !description || !icon) return error(400, "Nom, description et icône requis");

  const now = new Date();
  const inserted = await classBadges.insertOne({
    _id: new ObjectId(),
    classId: new ObjectId(id),
    name,
    description,
    icon,
    createdBy: userId,
    createdAt: now,
  });

  return Response.json({
    ok: true,
    badge: {
      id: inserted.insertedId.toHexString(),
      name,
      description,
      icon,
      createdBy: userId.toHexString(),
      createdAt: now.toISOString(),
    },
  });
}
