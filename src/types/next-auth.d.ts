import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/users";

declare module "next-auth" {
  /** Returned by `auth`, `useSession`, `getSession`. */
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  /** Object returned by `authorize`. */
  interface User {
    id?: string;
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
