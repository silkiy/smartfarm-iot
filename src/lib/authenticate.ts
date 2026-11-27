import type { Db } from "mongodb";
import { hashPassword, verifyPassword } from "./password";
import type { UserDocument, UserRole } from "./users";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const USERS_COLLECTION = "users";

/** Precomputed so an unknown email costs the same time as a wrong password. */
let dummyHashPromise: Promise<string> | undefined;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("dummy-password-for-timing");
  return dummyHashPromise;
}

/**
 * Verify email + password against the `users` collection.
 *
 * Returns `null` for unknown email OR wrong password -- the caller must surface
 * a single generic "invalid credentials" message; we never reveal which failed.
 * `passwordHash` is never returned. Runs bcrypt even for unknown emails to
 * reduce user-enumeration timing side channels.
 */
export async function authenticateCredentials(
  email: string,
  password: string,
  db: Db,
): Promise<AuthenticatedUser | null> {
  const user = await db.collection<UserDocument>(USERS_COLLECTION).findOne(
    { email },
    { projection: { name: 1, email: 1, passwordHash: 1, role: 1 } },
  );

  const passwordHash = user?.passwordHash ?? (await getDummyHash());
  const isValid = await verifyPassword(password, passwordHash);

  if (!user || !isValid) {
    return null;
  }

  return {
    id: user._id?.toString() ?? "",
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
