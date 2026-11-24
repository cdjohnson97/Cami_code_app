import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getMongoClient, MONGODB_DB, collections } from "@/lib/cloud/mongo";

// Auth.js (next-auth v5). Google lit AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, Auth.js lit AUTH_SECRET.
// L'adapter stocke les comptes dans MongoDB (`users`, `accounts`) ; les sessions sont des cookies JWT,
// donc vérifier qui est connecté ne coûte aucun aller-retour base de données.
// L'adapter reçoit une fonction plutôt qu'un client : rien ne touche MONGODB_URI tant qu'une requête
// n'en a pas besoin — l'app doit donc pouvoir build et tourner sans rien de configuré.
//
// Deux façons de se connecter :
//   • Google (OAuth) — AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET requis
//   • Email / mot de passe (provider Credentials) — les mots de passe sont hashés (pbkdf2, 100k itérations)
//     dans la collection `users` (champs passwordHash / passwordSalt).
function makePasswordSalt() {
  return crypto.randomBytes(16).toString("hex");
}
function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
}
function comparePassword(password: string, storedHash: string, storedSalt: string) {
  return hashPassword(password, storedSalt) === storedHash;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(() => getMongoClient(), { databaseName: MONGODB_DB }),
  providers: [
    Google,
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        action: { label: "Action", type: "hidden" },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        const action = (credentials?.action as string | undefined) ?? "signin";
        if (!email || !password) return null;

        const { users } = collections();
        const user = await users.findOne(
          { email },
          { projection: { _id: 1, name: 1, email: 1, role: 1, passwordHash: 1, passwordSalt: 1 } },
        );

        if (action === "signup") {
          if (user) throw new Error("Un compte existe déjà avec cet email.");
          const salt = makePasswordSalt();
          const inserted = await users.insertOne({
            _id: new ObjectId(),
            email,
            name: email.split("@")[0],
            role: "student",
            passwordHash: hashPassword(password, salt),
            passwordSalt: salt,
            createdAt: new Date(),
          });
          const created = await users.findOne(
            { _id: inserted.insertedId },
            { projection: { _id: 1, name: 1, email: 1, role: 1 } },
          );
          return {
            id: created!._id.toHexString(),
            email: created!.email,
            name: created!.name,
            role: created!.role,
          };
        }

        // signin
        if (!user || !user.passwordHash || !user.passwordSalt) {
          throw new Error("Identifiant ou mot de passe incorrect.");
        }
        if (!comparePassword(password, user.passwordHash, user.passwordSalt)) {
          throw new Error("Identifiant ou mot de passe incorrect.");
        }
        return {
          id: user._id.toHexString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    session({ session, token }) {
      // token.sub is the MongoDB `users._id` (as a string) — it's what /api/me and /admin key on.
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
  },
});
