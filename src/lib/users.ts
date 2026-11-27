import type { ObjectId } from "mongodb";

export type UserRole = "USER" | "ADMIN";

/** MongoDB `users` document. `passwordHash` never leaves the server. */
export type UserDocument = {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
};
