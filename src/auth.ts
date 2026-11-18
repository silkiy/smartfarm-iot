import "server-only";
import { authenticateCredentials } from "@/server/auth/login";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  logger: {
    error(error) {
      if (error.name !== "CredentialsSignin")
        console.error({ event: "authentication_error", type: error.name });
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authenticateCredentials,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
