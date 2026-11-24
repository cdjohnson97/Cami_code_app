import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { checkAdminAccess } from "@/app/admin/access";

const error = (status: number, message: string) => Response.json({ error: message }, { status });

// PATCH /api/admin/users/[id]/role — changer le rôle d'un utilisateur (admin uniquement)
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!cloudEnabled) return error(403, "Backend non configuré");

  const access = await checkAdminAccess();
  if (!access.ok) return error(403, access.message);

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return error(400, "ID utilisateur invalide");

  let body: { role: string };
  try {
    body = await _request.json();
  } catch {
    return error(400, "JSON invalide");
  }

  if (!["student", "teacher", "admin"].includes(body.role)) {
    return error(400, "Rôle invalide (student, teacher, admin)");
  }

  const { users } = collections();
  const result = await users.updateOne(
    { _id: new ObjectId(id) },
    { $set: { role: body.role as "student" | "teacher" | "admin" } }
  );

  if (result.matchedCount === 0) return error(404, "Utilisateur introuvable");
  return Response.json({ ok: true });
}
