import bcrypt from "bcryptjs";

/** bcrypt work factor. AGENT.md D4 requires >= 12; reviewed against hardware. */
export const BCRYPT_COST = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_COST);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
