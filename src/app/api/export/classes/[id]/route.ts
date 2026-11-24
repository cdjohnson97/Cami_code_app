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

// GET /api/export/classes/[id] — export CSV des résultats d'une classe
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await currentUser();
  if (!userId) return error(401, "Non connecté");

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID de classe invalide");

  const { users, classes, progress, preferences } = collections();

  const cls = await classes.findOne({ _id: new ObjectId(id) });
  if (!cls) return error(404, "Classe introuvable");

  const me = await users.findOne({ _id: userId }, { projection: { role: 1 } });
  const role = me?.role ?? "student";
  if (role !== "admin" && cls.teacherId.toHexString() !== userId.toHexString()) {
    return error(403, "Accès refusé");
  }

  const studentIds = (cls.members ?? [])
    .filter((m) => m.role === "student")
    .map((m) => m.userId);

  const [studentDocs, prefDocs, progressDocs] = await Promise.all([
    users.find({ _id: { $in: studentIds } }, { projection: { name: 1, email: 1 } }).toArray(),
    preferences.find({ _id: { $in: studentIds } }, { projection: { _id: 1, name: 1 } }).toArray(),
    progress.find({ _id: { $in: studentIds } }).toArray(),
  ]);

  const prefsById = new Map(prefDocs.map((p) => [p._id.toHexString(), p.name]));
  const progressById = new Map(progressDocs.map((d) => [d._id.toHexString(), d]));

  // Construire le CSV
  const lines: string[] = [];
  lines.push("Nom,Email,Prénom,Exercices réussis,Progression %,Série,Dernière visite");

  for (const u of studentDocs) {
    const id = u._id.toHexString();
    const prog = progressById.get(id);
    const completed = prog?.completed ? Object.values(prog.completed).filter(Boolean).length : 0;
    const pct = prog?.completed ? Math.round((completed / Object.keys(prog.completed).length) * 100) : 0;
    lines.push(
      `"${u.name ?? ""}","${u.email ?? ""}","${prefsById.get(id) ?? ""}",${completed},${pct},${prog?.streak ?? 0},"${prog?.lastVisitDay ?? ""}"`
    );
  }

  const csv = lines.join("\n");
  const filename = `classe_${cls.code}_export_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
