import { MongoClient, type ObjectId } from "mongodb";
import type { PreferencesData, ProgressData } from "./shape";

// Server-only: never import this from a client component (it reads MONGODB_URI).

export const MONGODB_DB = process.env.MONGODB_DB || "cami";

// One client per server process. Cached on globalThis so `next dev` hot reloads don't open a new
// connection pool on every edit. Created unconnected — the driver connects on first use, which is
// also what @auth/mongodb-adapter recommends (no unhandled rejection if the cluster is down).
const globalForMongo = globalThis as unknown as { _camiMongoClient?: MongoClient };

export function getMongoClient(): MongoClient {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI n'est pas défini (voir .env.local.example).");
  if (!globalForMongo._camiMongoClient) globalForMongo._camiMongoClient = new MongoClient(uri);
  return globalForMongo._camiMongoClient;
}

/** `users` is written by the Auth.js adapter; `role` is ours (absent = "student"). */
export type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "student" | "admin" | "teacher";
  classId?: ObjectId;
};

/** One document per user, `_id` = the user's `_id`. */
export type ProgressDoc = Partial<ProgressData> & { _id: ObjectId; updatedAt: Date };
export type PreferencesDoc = Partial<PreferencesData> & { _id: ObjectId; updatedAt: Date };

/** One document per class, `_id` = class id, `code` = invitation code shared with learners. */
export type ClassMember = { userId: ObjectId; role: "teacher" | "student" };

export type ClassDoc = {
  _id: ObjectId;
  code: string;
  name: string;
  teacherId: ObjectId;
  members: ClassMember[];
  createdAt: Date;
  /** Si défini, le code d'invitation expire à cette date. */
  codeExpiresAt?: Date;
  /** Nombre maximal d'élèves autorisés (optionnel). */
  maxStudents?: number;
};

/** Un devoir assigné à une classe par un enseignant. */
export type DevoirDoc = {
  _id: ObjectId;
  classId: ObjectId;
  exerciseId: string;
  title: string;
  dueDate: Date | null;
  createdBy: ObjectId;
  createdAt: Date;
};

/** Une soumission de devoir par un élève. */
export type DevoirSoumisDoc = {
  _id: ObjectId;
  devoirId: ObjectId;
  userId: ObjectId;
  status: "en_cours" | "termine";
  submittedAt?: Date;
  note?: string;
};

/** Une annonce publiée dans une classe. */
export type AnnonceDoc = {
  _id: ObjectId;
  classId: ObjectId;
  title: string;
  content: string;
  createdBy: ObjectId;
  createdAt: Date;
};

/** Un badge de classe décerné par un enseignant. */
export type ClassBadgeDoc = {
  _id: ObjectId;
  classId: ObjectId;
  name: string;
  description: string;
  icon: string;
  createdBy: ObjectId;
  createdAt: Date;
};

export function collections() {
  const db = getMongoClient().db(MONGODB_DB);
  return {
    users: db.collection<UserDoc>("users"),
    progress: db.collection<ProgressDoc>("progress"),
    preferences: db.collection<PreferencesDoc>("preferences"),
    classes: db.collection<ClassDoc>("classes"),
    devoirs: db.collection<DevoirDoc>("devoirs"),
    devoirsSoumis: db.collection<DevoirSoumisDoc>("devoirs_soumis"),
    annonces: db.collection<AnnonceDoc>("annonces"),
    classBadges: db.collection<ClassBadgeDoc>("class_badges"),
  };
}
