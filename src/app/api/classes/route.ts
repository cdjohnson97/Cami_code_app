import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { isPlainObject } from "@/lib/cloud/shape";
import { checkAdminAccess } from "@/app/admin/access";

// Codes d'invitation : 6 majuscules/chiffres, uniques.
function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const error = (status: number, message: string) => Response.json({ error: message }, { status });

async function currentUser() {
  if (!cloudEnabled) return null;
  const session = await auth();
  const id = session?.user?.id;
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

type ClassMember = { userId: ObjectId; role: "teacher" | "student" };

export type ClassDoc = {
  _id: ObjectId;
  code: string;
  name: string;
  teacherId: ObjectId;
  members: ClassMember[];
  createdAt: Date;
};

// GET : mes classes (enseignant/admin) ou ma classe (élève)
// Admin voit toutes les classes.
export async function GET() {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { users, classes } = collections();
  const me = await users.findOne({ _id: userId }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";

  if (role === "admin") {
    const docs = await classes.find().sort({ createdAt: -1 }).toArray();
    return Response.json({
      classes: docs.map((d) => ({
        id: d._id.toHexString(),
        code: d.code,
        name: d.name,
        memberCount: (d.members ?? []).length,
      })),
    });
  }

  if (role === "teacher") {
    // Classes où l'utilisateur est propriétaire OU membre enseignant
    const docs = await classes.find({
      $or: [{ teacherId: userId }, { "members.userId": userId }],
    }).sort({ createdAt: -1 }).toArray();
    return Response.json({
      classes: docs.map((d) => ({
        id: d._id.toHexString(),
        code: d.code,
        name: d.name,
        memberCount: (d.members ?? []).length,
      })),
    });
  }

  // Élève : sa classe via users.classId (rétro-compatible) ou members
  if (!me?.classId) return Response.json({ class: null });
  const cls = await classes.findOne({ _id: me.classId }, { projection: { code: 1, name: 1 } });
  return Response.json({ class: cls ? { id: cls._id.toHexString(), code: cls.code, name: cls.name } : null });
}

// POST : créer une classe (admin/teacher) OU rejoindre une classe (élève via code)
//      OU ajouter/retirer un membre d'une classe (admin uniquement)
export async function POST(request: Request) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return error(400, "JSON invalide");
  }
  if (!isPlainObject(body)) return error(400, "Format invalide");

  const { users, classes } = collections();
  const me = await users.findOne({ _id: userId }, { projection: { role: 1 } });
  const role = me?.role ?? "student";

  // ---------- Admin : ajouter un membre à une classe ----------
  if (role === "admin" && body.action === "addMember") {
    const classId = typeof body.classId === "string" ? body.classId : "";
    const userIdToAdd = typeof body.userId === "string" ? body.userId : "";
    const memberRole = body.memberRole === "teacher" ? "teacher" : "student";

    if (!ObjectId.isValid(classId) || !ObjectId.isValid(userIdToAdd)) {
      return error(400, "ID de classe ou d'utilisateur invalide");
    }

    const cls = await classes.findOne({ _id: new ObjectId(classId) });
    if (!cls) return error(404, "Classe introuvable");

    const already = cls.members?.some((m) => m.userId.toHexString() === userIdToAdd);
    if (already) return error(400, "L'utilisateur est déjà membre de cette classe");

    await classes.updateOne(
      { _id: new ObjectId(classId) },
      { $push: { members: { userId: new ObjectId(userIdToAdd), role: memberRole } } }
    );

    // Mettre à jour classId sur l'utilisateur (champ legacy, un seul pour l'élève)
    if (memberRole === "student") {
      await users.updateOne({ _id: new ObjectId(userIdToAdd) }, { $set: { classId: new ObjectId(classId) } });
    }

    return Response.json({ ok: true });
  }

  // ---------- Admin : retirer un membre d'une classe ----------
  if (role === "admin" && body.action === "removeMember") {
    const classId = typeof body.classId === "string" ? body.classId : "";
    const userIdToRemove = typeof body.userId === "string" ? body.userId : "";

    if (!ObjectId.isValid(classId) || !ObjectId.isValid(userIdToRemove)) {
      return error(400, "ID de classe ou d'utilisateur invalide");
    }

    await classes.updateOne(
      { _id: new ObjectId(classId) },
      { $pull: { members: { userId: new ObjectId(userIdToRemove) } } }
    );

    return Response.json({ ok: true });
  }

  // ---------- Enseignant : créer une classe ----------
  if ((role === "teacher" || role === "admin") && body.action === "create") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) return error(400, "Nom de classe invalide (1-60 caractères)");

    let codeExpiresAt: Date | undefined;
    if (body.codeExpiresAt !== undefined && body.codeExpiresAt !== null) {
      const d = new Date(body.codeExpiresAt as string);
      if (isNaN(d.getTime())) return error(400, "Date d'expiration invalide");
      codeExpiresAt = d;
    }

    let maxStudents: number | undefined;
    if (body.maxStudents !== undefined && body.maxStudents !== null) {
      const n = Number(body.maxStudents);
      if (!Number.isInteger(n) || n < 1) return error(400, "maxStudents doit être un entier positif");
      maxStudents = n;
    }

    let code: string;
    let attempts = 0;
    do {
      code = makeCode();
      attempts++;
    } while ((await classes.findOne({ code })) && attempts < 10);
    if (attempts >= 10) return error(500, "Impossible de générer un code unique");

    const result = await classes.insertOne({
      _id: new ObjectId(),
      code,
      name,
      teacherId: userId,
      members: [{ userId, role: "teacher" }],
      createdAt: new Date(),
      ...(codeExpiresAt ? { codeExpiresAt } : {}),
      ...(maxStudents ? { maxStudents } : {}),
    });
    return Response.json({ ok: true, class: { id: result.insertedId.toHexString(), code, name } });
  }

  // ---------- Élève : rejoindre une classe avec un code ----------
  if (body.action === "join" && typeof body.code === "string") {
    const code = body.code.trim().toUpperCase();
    if (!code) return error(400, "Code d'invitation requis");

    const cls = await classes.findOne({ code });
    if (!cls) return error(404, "Code d'invitation inconnu");

    // Vérifier expiration du code
    if (cls.codeExpiresAt && new Date(cls.codeExpiresAt) < new Date()) {
      return error(403, "Ce code d'invitation a expiré");
    }

    // Vérifier limite d'élèves
    if (cls.maxStudents) {
      const studentCount = (cls.members ?? []).filter((m) => m.role === "student").length;
      if (studentCount >= cls.maxStudents) {
        return error(403, "Cette classe a atteint le nombre maximal d'élèves");
      }
    }

    const alreadyMember = cls.members?.some((m) => m.userId.toHexString() === userId.toHexString());
    if (!alreadyMember) {
      await classes.updateOne(
        { _id: cls._id },
        { $push: { members: { userId, role: "student" } } }
      );
    }
    await users.updateOne({ _id: userId }, { $set: { classId: cls._id } });

    return Response.json({ ok: true, class: { id: cls._id.toHexString(), code: cls.code, name: cls.name } });
  }

  return error(400, "Action inconnue");
}
