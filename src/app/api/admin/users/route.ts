import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { checkAdminAccess } from "@/app/admin/access";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

// GET /api/admin/users — liste tous les utilisateurs (admin uniquement)
export async function GET() {
  if (!cloudEnabled) return error(403, "Backend non configuré");

  const access = await checkAdminAccess();
  if (!access.ok) return error(403, access.message);

  const { users, preferences, classes } = collections();

  const [userDocs, prefDocs, classDocs] = await Promise.all([
    users.find({}, { projection: { name: 1, email: 1, role: 1, classId: 1 } }).sort({ _id: -1 }).toArray(),
    preferences.find({}, { projection: { _id: 1, name: 1 } }).toArray(),
    classes.find({}, { projection: { _id: 1, name: 1, members: 1 } }).toArray(),
  ]);

  const prefsById = new Map(prefDocs.map((p) => [p._id.toHexString(), p.name]));
  const classesById = new Map(classDocs.map((c) => [c._id.toHexString(), c]));

  const rows = userDocs.map((u) => {
    const id = u._id.toHexString();
    const userClasses: { id: string; name: string; role: string }[] = [];
    for (const [cid, c] of classesById.entries()) {
      const m = c.members?.find((m) => m.userId.toHexString() === id);
      if (m) userClasses.push({ id: cid, name: c.name, role: m.role });
    }

    return {
      id,
      name: prefsById.get(id) || u.name || null,
      email: u.email ?? null,
      role: u.role ?? "student",
      classes: userClasses,
    };
  });

  return Response.json({ users: rows });
}
