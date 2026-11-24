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

// GET /api/classes/[id]/stats — statistiques d'une classe (progression, devoirs, annonces)
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  const { users, classes, progress, preferences, devoirs, devoirsSoumis, annonces } = collections();

  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1, classId: 1 } });
  const role = me?.role ?? "student";

  if (role !== "admin" && cls.teacherId.toHexString() !== userId.toHexString()) {
    return error(403, "Accès refusé");
  }

  // Membres de la classe
  const members = cls.members ?? [];
  const studentIds = members.filter((m) => m.role === "student").map((m) => m.userId);
  const teacherIds = members.filter((m) => m.role === "teacher").map((m) => m.userId);

  // Info des étudiants
  const studentDocs = await users.find(
    { _id: { $in: studentIds } },
    { projection: { name: 1, email: 1, role: 1, classId: 1 } }
  ).toArray();
  const prefsByUser = new Map(
    (await preferences.find({ _id: { $in: studentIds } }, { projection: { _id: 1, name: 1 } }).toArray())
      .map((p) => [p._id.toHexString(), p.name])
  );

  // Progression des étudiants
  const progressDocs = await progress.find({ _id: { $in: studentIds } }).toArray();
  const progressByUser = new Map(progressDocs.map((d) => [d._id.toHexString(), d]));

  // Total exercices (à importer depuis le curriculum)
  // On utilise une approximation: compter les exercices uniques dans le code des élèves
  let totalExercises = 0;
  for (const prog of progressDocs) {
    if (prog.completed) totalExercises = Math.max(totalExercises, Object.keys(prog.completed).length);
  }

  const studentRows = studentDocs.map((u) => {
    const id = u._id.toHexString();
    const prog = progressByUser.get(id);
    const completed = prog?.completed ? Object.values(prog.completed).filter(Boolean).length : 0;
    const pct = totalExercises > 0 ? Math.round((completed / totalExercises) * 100) : 0;
    return {
      id,
      name: prefsByUser.get(id) || u.name || null,
      email: u.email ?? null,
      completed,
      total: totalExercises,
      pct,
      streak: prog?.streak ?? 0,
      lastVisitDay: prog?.lastVisitDay ?? null,
    };
  });

  // Devoirs de la classe
  const classDevoirs = await devoirs.find({ classId: new ObjectId(id) }).sort({ createdAt: -1 }).toArray();
  const devoirRows = classDevoirs.map((d) => ({
    id: d._id.toHexString(),
    title: d.title,
    exerciseId: d.exerciseId,
    dueDate: d.dueDate?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  // Annonces récentes
  const recentAnnounces = await annonces.find({ classId: new ObjectId(id) }).sort({ createdAt: -1 }).limit(5).toArray();
  const annonceRows = recentAnnounces.map((a) => ({
    id: a._id.toHexString(),
    title: a.title,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
  }));

  // Statistiques globales
  const totalStudents = studentIds.length;
  const avgPct = studentRows.length
    ? Math.round(studentRows.reduce((n, r) => n + r.pct, 0) / studentRows.length)
    : 0;
  const completedCourse = studentRows.filter((r) => r.pct === 100).length;

  return Response.json({
    class: {
      id: cls._id.toHexString(),
      code: cls.code,
      name: cls.name,
      teacherId: cls.teacherId.toHexString(),
      memberCount: members.length,
      codeExpiresAt: cls.codeExpiresAt?.toISOString() ?? null,
      maxStudents: cls.maxStudents ?? null,
    },
    stats: {
      totalStudents,
      avgPct,
      completedCourse,
      totalExercises,
    },
    students: studentRows,
    devoirs: devoirRows,
    annonces: annonceRows,
  });
}
