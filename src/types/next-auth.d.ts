import type { UserRole } from "@/domain/models";

declare module "next-auth" {
  interface User {
    role: UserRole;
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      sessionVersion: number;
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    sessionVersion?: number;
  }
}
