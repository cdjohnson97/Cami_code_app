import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { cloudEnabled } from "@/lib/cloud/config";
import { collections } from "@/lib/cloud/mongo";
import { isPlainObject, validatePreferences, validateProgress } from "@/lib/cloud/shape";

// The signed-in learner's own data: GET to pull it, PUT to save it. A user can only ever reach
// their own documents — the id comes from the session cookie, never from the request.

const MAX_BODY_BYTES = 1_000_000;

async function currentUserId(): Promise<ObjectId | null> {
  if (!cloudEnabled) return null;
  const session = await auth();
  const id = session?.user?.id;
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

const error = (status: number, message: string, extra?: object) =>
  Response.json({ error: message, ...extra }, { status });

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return error(401, "Non connecté");

  const { users, progress, preferences } = collections();
  const [user, progressDoc, preferencesDoc] = await Promise.all([
    users.findOne({ _id: userId }, { projection: { role: 1 } }),
    progress.findOne({ _id: userId }, { projection: { _id: 0, updatedAt: 0 } }),
    preferences.findOne({ _id: userId }, { projection: { _id: 0, updatedAt: 0 } }),
  ]);

  return Response.json({
    role: user?.role ?? "student",
    progress: progressDoc,
    preferences: preferencesDoc,
  });
}

export async function PUT(request: Request) {
  const userId = await currentUserId();
  if (!userId) return error(401, "Non connecté");

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return error(413, "Données trop volumineuses");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return error(400, "JSON invalide");
  }
  if (!isPlainObject(body)) return error(400, "Format invalide");

  const { progress, preferences } = collections();
  const updatedAt = new Date();
  const writes: Promise<unknown>[] = [];

  if (body.progress !== undefined) {
    const result = validateProgress(body.progress);
    if (!result.ok) return error(400, "Champ invalide", { field: `progress.${result.field}` });
    writes.push(progress.updateOne({ _id: userId }, { $set: { ...result.value, updatedAt } }, { upsert: true }));
  }

  if (body.preferences !== undefined) {
    const result = validatePreferences(body.preferences);
    if (!result.ok) return error(400, "Champ invalide", { field: `preferences.${result.field}` });
    writes.push(preferences.updateOne({ _id: userId }, { $set: { ...result.value, updatedAt } }, { upsert: true }));
  }

  await Promise.all(writes);
  return Response.json({ ok: true, updatedAt: updatedAt.toISOString() });
}
