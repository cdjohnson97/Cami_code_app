import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { validateDevoir } from "@/lib/cloud/shape";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

async function currentUser() {
  if (!cloudEnabled) return null;
  const session = await auth();
  const id = session?.user?.id;
  return id && ObjectId.isValid(id) ? { id: new ObjectId(id), role: (session as any).user?.role as string | undefined } : null;
}

// GET /api/devoirs — enseignant: ses devoirs par classe ; élève: devoirs de sa classe
export async function GET(request: Request) {
  const me = await currentUser();
  if (!me) return error(401, "Non connecté");

  const { users, classes, devoirs } = collections();
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  const meUser = await users.findOne({ _id: me.id }, { projection: { role: 1, classId: 1 } });
  const role = meUser?.role ?? "student";

  let filter: Record<string, unknown> = {};
  if (role === "admin") {
    if (classId) filter.classId = new ObjectId(classId as string);
  } else if (role === "teacher") {
    // Vérifier que la classe appartient à l'enseignant
    if (classId) {
      const cls = await classes.findOne({ _id: new ObjectId(classId as string), teacherId: me.id });
      if (!cls) return error(403, "Classe introuvable ou non autorisée");
      filter.classId = new ObjectId(classId as string);
    } else {
      filter.teacherId = me.id;
    }
  } else {
    // Élève : devoirs de sa classe
    if (!meUser?.classId) return Response.json({ devoirs: [] });
    filter.classId = meUser.classId;
  }

  const docs = await devoirs.find(filter).sort({ createdAt: -1 }).toArray();
  return Response.json({
    devoirs: docs.map((d) => ({
      id: d._id.toHexString(),
      classId: d.classId.toHexString(),
      exerciseId: d.exerciseId,
      title: d.title,
      dueDate: d.dueDate?.toISOString() ?? null,
      createdBy: d.createdBy.toHexString(),
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

// POST /api/devoirs — créer un devoir (enseignant ou admin)
export async function POST(request: Request) {
  const me = await currentUser();
  if (!me) return error(401, "Non connecté");

  const { users, classes, devoirs } = collections();
  const meUser = await users.findOne({ _id: me.id }, { projection: { role: 1 } });
  const role = meUser?.role ?? "student";
  if (role !== "teacher" && role !== "admin") return error(403, "Seuls les enseignants peuvent créer des devoirs");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "JSON invalide");
  }

  const result = validateDevoir(body);
  if (!result.ok) return error(400, `Champ invalide: ${result.field}`);

  const { classId, exerciseId, title, dueDate } = result.value as {
    classId: string;
    exerciseId: string;
    title: string;
    dueDate: string | null;
  };

  if (!ObjectId.isValid(classId)) return error(400, "ID de classe invalide");

  // Vérifier l'autorisation sur la classe
  const cls = await classes.findOne({ _id: new ObjectId(classId as string) });
  if (!cls) return error(404, "Classe introuvable");
  if (role === "teacher" && cls.teacherId.toHexString() !== me.id.toHexString()) {
    return error(403, "Vous n'êtes pas l'enseignant de cette classe");
  }

  const now = new Date();
  const inserted = await devoirs.insertOne({
    _id: new ObjectId(),
    classId: new ObjectId(classId),
    exerciseId,
    title,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: me.id,
    createdAt: now,
  });

  return Response.json({
    ok: true,
    devoir: {
      id: inserted.insertedId.toHexString(),
      classId,
      exerciseId,
      title,
      dueDate: dueDate ?? null,
      createdBy: me.id,
      createdAt: now.toISOString(),
    },
  });
}
