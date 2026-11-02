import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/env";

const body = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(12),
});

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid input", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }
  const { email, username, password } = parsed.data;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length) return NextResponse.json({ ok: false, error: { code: "EXISTS", message: "Email in use" } }, { status: 409 });
  const id = crypto.randomUUID();
  await db.insert(schema.users).values({ id, email, username, passwordHash: await hashPassword(password), role: "STUDENT" });
  const token = await createSession(id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, data: { id } });
}