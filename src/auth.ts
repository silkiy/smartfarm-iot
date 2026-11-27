import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { authenticateCredentials } from "@/lib/authenticate";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@/lib/users";
import { signInSchema } from "@/lib/validations/auth";

/** AGENT.md §12.4: rate-limit login. Best-effort per-process (see src/lib/rate-limit.ts). */
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

/** One generic message for every failure mode; never leak which field was wrong. */
function logAuthError(message: string, error: unknown): void {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getEnv().AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials, request) => {
        try {
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const key = request ? clientKey(request, "login") : "login:unknown";
          if (!rateLimit(key, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS).allowed) return null;

          const db = await getDb();
          const user = await authenticateCredentials(
            parsed.data.email,
            parsed.data.password,
            db,
          );

          return user; // null on any failure -> generic sign-in error
        } catch (error) {
          logAuthError("credentials authorize failed", error); // do not swallow
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = (user.role ?? "USER") satisfies UserRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : (token.sub ?? "");
        session.user.role = String(token.role) === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    },
  },
});
