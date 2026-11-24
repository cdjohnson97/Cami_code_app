import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { validateDevoirSoumis } from "@/lib/cloud/shape";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

async function currentUser() {
  if (!cloudEnabled) return null;
  const session = await auth();
  const id = session?.user?.id;
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// GET /api/devoirs/[id]/soumis — liste les soumissions d'un devoir
export async function GET(
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

  const me = await users.findOne({ _id: userId }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";
  const cls = await classes.findOne({ _id: devoir.classId });

  if (role !== "admin" && cls?.teacherId.toHexString() !== userId.toHexString()) {
    const soumis = await devoirsSoumis.findOne({ devoirId: new ObjectId(id), userId });
    return Response.json({
      soumis: soumis ? [{ id: soumis._id.toHexString(), status: soumis.status, submittedAt: soumis.submittedAt?.toISOString() ?? null, note: soumis.note ?? null }] : [],
    });
  }

  const docs = await devoirsSoumis.find({ devoirId: new ObjectId(id) }).toArray();
  const userIds = docs.map((d) => d.userId);
  const userDocs = await users.find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1 } }).toArray();
  const usersById = new Map(userDocs.map((u) => [u._id.toHexString(), u]));

  return Response.json({
    soumis: docs.map((d) => {
      const u = usersById.get(d.userId.toHexString());
      return {
        id: d._id.toHexString(),
        userId: d.userId.toHexString(),
        name: u?.name ?? null,
        email: u?.email ?? null,
        status: d.status,
        submittedAt: d.submittedAt?.toISOString() ?? null,
        note: d.note ?? null,
      };
    }),
  });
}

// POST /api/devoirs/[id]/soumis — un élève soumet son devoir
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de devoir invalide");

  const { users, classes, devoirs, devoirsSoumis } = collections();
  const devoir = await devoirs.findOne({ _id: new ObjectId(id) });
  if (!devoir) return error(404, "Devoir introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";
  if (role !== "student") return error(403, "Seuls les élèves peuvent soumettre un devoir");

  if (!me?.classId || me.classId.toHexString() !== devoir.classId.toHexString()) {
    return error(403, "Vous n'êtes pas dans la classe de ce devoir");
  }

  const exists = await devoirsSoumis.findOne({ devoirId: new ObjectId(id), userId });
  if (exists) return error(400, "Devoir déjà soumis");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "JSON invalide");
  }

  const result = validateDevoirSoumis(body);
  if (!result.ok) return error(400, `Champ invalide: ${result.field}`);

  const { status, note } = result.value as { status: string; note: string | null };

  const now = new Date();
  const inserted = await devoirsSoumis.insertOne({
    _id: new ObjectId(),
    devoirId: new ObjectId(id),
    userId,
    status: status as "en_cours" | "termine",
    submittedAt: status === "termine" ? now : undefined,
    note: note ?? undefined,
  });

  return Response.json({
    ok: true,
    soumis: {
      id: inserted.insertedId.toHexString(),
      status,
      submittedAt: status === "termine" ? now.toISOString() : null,
      note: note ?? null,
    },
  });
}
