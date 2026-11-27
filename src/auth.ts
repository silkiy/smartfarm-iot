import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/domain/auth";
import { verifyPassword } from "@/server/auth/passwords";
import { getMongoDatabase } from "@/server/db/mongodb";
import type { ProfileDocument } from "@/domain/models";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const db = await getMongoDatabase();
        const profile = await db
          .collection<ProfileDocument>("profiles")
          .findOne({ username: parsed.data.username, isActive: true });

        if (!profile) return null;

        const valid = await verifyPassword(parsed.data.password, profile.passwordHash);
        if (!valid) return null;

        return {
          id: profile.userId,
          username: profile.username,
          name: profile.displayName,
          role: profile.role,
          sessionVersion: profile.sessionVersion ?? 0,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      // Verifikasi sessionVersion masih valid
      const db = await getMongoDatabase();
      const profile = await db
        .collection<ProfileDocument>("profiles")
        .findOne({ userId: token.id as string });

      if (
        !profile ||
        !profile.isActive ||
        (profile.sessionVersion ?? 0) !== token.sessionVersion
      ) {
        // Session tidak valid — paksa logout
        return { ...session, user: undefined as unknown as typeof session.user };
      }

      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.role = token.role as "ADMIN" | "USER";
      session.user.sessionVersion = token.sessionVersion as number;
      return session;
    },
  },
});
