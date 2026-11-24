import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { validateAnnonce } from "@/lib/cloud/shape";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

async function currentUser() {
  if (!cloudEnabled) return null;
  const session = await auth();
  const id = session?.user?.id;
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// GET /api/annonces — annonces de mes classes (enseignant) ou de ma classe (élève)
export async function GET(request: Request) {
  const me = await currentUser();
  if (!me) return error(401, "Non connecté");

  const { users, classes, annonces } = collections();
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  const meUser = await users.findOne({ _id: me.id }, { projection: { role: 1, classId: 1 } });
  const role = meUser?.role ?? "student";

  let filter: Record<string, unknown> = {};
  if (role === "admin") {
    if (classId) filter.classId = new ObjectId(classId as string);
  } else if (role === "teacher") {
    if (classId) {
      const cls = await classes.findOne({ _id: new ObjectId(classId as string), teacherId: me.id });
      if (!cls) return error(403, "Classe introuvable ou non autorisée");
      filter.classId = new ObjectId(classId as string);
    } else {
      const clsDocs = await classes.find({ teacherId: me.id }, { projection: { _id: 1 } }).toArray();
      filter.classId = { $in: clsDocs.map((c) => c._id) };
    }
  } else {
    if (!meUser?.classId) return Response.json({ annonces: [] });
    filter.classId = meUser.classId;
  }

  const docs = await annonces.find(filter).sort({ createdAt: -1 }).toArray();
  return Response.json({
    annonces: docs.map((d) => ({
      id: d._id.toHexString(),
      classId: d.classId.toHexString(),
      title: d.title,
      content: d.content,
      createdBy: d.createdBy.toHexString(),
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

// POST /api/annonces — créer une annonce (enseignant ou admin)
export async function POST(request: Request) {
  const me = await currentUser();
  if (!me) return error(401, "Non connecté");

  const { users, classes, annonces } = collections();
  const meUser = await users.findOne({ _id: me.id }, { projection: { role: 1 } });
  const role = meUser?.role ?? "student";
  if (role !== "teacher" && role !== "admin") return error(403, "Seuls les enseignants peuvent créer des annonces");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "JSON invalide");
  }

  const result = validateAnnonce(body);
  if (!result.ok) return error(400, `Champ invalide: ${result.field}`);

  const { classId, title, content } = result.value as {
    classId: string;
    title: string;
    content: string;
  };

  if (!ObjectId.isValid(classId)) return error(400, "ID de classe invalide");

  const cls = await classes.findOne({ _id: new ObjectId(classId as string) });
  if (!cls) return error(404, "Classe introuvable");
  if (role === "teacher" && String(cls.teacherId) !== String(me.id)) {
    return error(403, "Vous n'êtes pas l'enseignant de cette classe");
  }

  const now = new Date();
  const inserted = await annonces.insertOne({
    _id: new ObjectId(),
    classId: new ObjectId(classId as string),
    title,
    content,
    createdBy: me.id as unknown as ObjectId,
    createdAt: now,
  });

  return Response.json({
    ok: true,
    annonce: {
      id: inserted.insertedId.toHexString(),
      classId,
      title,
      content,
      createdBy: me.id,
      createdAt: now.toISOString(),
    },
  });
}
