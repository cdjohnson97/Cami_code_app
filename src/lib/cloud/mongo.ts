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
  role?: "student" | "admin";
};

/** One document per user, `_id` = the user's `_id`. */
export type ProgressDoc = Partial<ProgressData> & { _id: ObjectId; updatedAt: Date };
export type PreferencesDoc = Partial<PreferencesData> & { _id: ObjectId; updatedAt: Date };

export function collections() {
  const db = getMongoClient().db(MONGODB_DB);
  return {
    users: db.collection<UserDoc>("users"),
    progress: db.collection<ProgressDoc>("progress"),
    preferences: db.collection<PreferencesDoc>("preferences"),
  };
}
