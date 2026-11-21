import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { db, schema } from "@/lib/db";
const users = schema.users;
const sessions = schema.sessions;
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import argon2 from "argon2";

export type Role = "GUEST" | "STUDENT" | "INSTRUCTOR" | "ADMIN";
const ROLE_LEVEL: Record<Role, number> = { GUEST: 0, STUDENT: 1, INSTRUCTOR: 2, ADMIN: 3 };

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required];
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: env.ARGON2_MEMORY_COST });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try { return await argon2.verify(hash, password); } catch { return false; }
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const raw = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86400000);
  await db.insert(sessions).values({ id: crypto.randomUUID(), userId, tokenHash, expiresAt });
  return raw;
}

export async function getSessionUser() {
  const c = await cookies();
  const token = c.get("session")?.value;
  if (!token) return null;
  const tokenHash = sha256(token);
  const rows = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash));
  const session = rows[0];
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  const urows = await db.select().from(users).where(eq(users.id, session.userId));
  const user = urows[0];
  if (!user || user.banned) return null;
  return { id: user.id, email: user.email, username: user.username, role: user.role as Role, xp: user.xp };
}

export async function setSessionCookie(token: string): Promise<void> {
  const c = await cookies();
  const secure = (env.APP_URL || "").startsWith("https://");
  c.set("session", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 86400,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete("session");
}
