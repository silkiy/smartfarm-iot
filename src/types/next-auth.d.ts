import type { UserRole } from "@/domain/models";
import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      role: UserRole;
      sessionVersion: number;
    };
  }
  interface User {
    id: string;
    username: string;
    role: UserRole;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: UserRole;
    sessionVersion: number;
  }
}
