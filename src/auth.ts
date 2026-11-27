import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/domain/auth";
import { verifyPassword } from "@/server/auth/passwords";
import { getMongoDatabase } from "@/server/db/mongodb";
import { checkRateLimit, clearAttempts } from "@/server/auth/rate-limit";
import type { ProfileDocument } from "@/domain/models";

// Dummy hash untuk timing parity saat username tidak ditemukan.
// Mencegah attacker membedakan "username tidak ada" vs "password salah"
// berdasarkan response time (bcrypt ~100-200ms vs ~1ms).
const DUMMY_HASH = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VK8e1A6Iy";

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

        const { username, password } = parsed.data;

        // Cek rate limit sebelum query DB
        const allowed = await checkRateLimit(username);
        if (!allowed) return null;

        const db = await getMongoDatabase();
        const profile = await db
          .collection<ProfileDocument>("profiles")
          .findOne({ username, isActive: true });

        // Timing parity: selalu jalankan bcrypt meski user tidak ada
        const hash = profile?.passwordHash ?? DUMMY_HASH;
        const valid = await verifyPassword(password, hash);

        if (!profile || !valid) return null;

        // Login berhasil — hapus attempt counter
        await clearAttempts(username);

        return {
          id: profile.userId,
          username: profile.username,
          name: profile.displayName,
          role: profile.role,
          sessionVersion: profile.sessionVersion,
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
      const db = await getMongoDatabase();
      const profile = await db.collection<ProfileDocument>("profiles").findOne(
        { userId: token.id as string },
        {
          projection: { sessionVersion: 1, isActive: 1, _id: 0 },
        },
      );

      if (
        !profile ||
        !profile.isActive ||
        profile.sessionVersion !== token.sessionVersion
      ) {
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
