import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getMongoClient, MONGODB_DB } from "@/lib/cloud/mongo";

// Auth.js (next-auth v5). Google reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the environment,
// Auth.js itself reads AUTH_SECRET. The adapter stores accounts in MongoDB (`users`, `accounts`);
// sessions are JWT cookies, so checking who's signed in costs no database round-trip.
// The adapter gets a function rather than a client so nothing touches MONGODB_URI until a
// request actually needs it — the app must still build and run without any of this configured.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(() => getMongoClient(), { databaseName: MONGODB_DB }),
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      // token.sub is the MongoDB `users._id` (as a string) — it's what /api/me and /admin key on.
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
