import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid input" } }, { status: 400 });
  const { email, password } = parsed.data;
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const user = rows[0];
  if (!user) return NextResponse.json({ ok: false, error: { code: "INVALID", message: "Invalid credentials" } }, { status: 401 });
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return NextResponse.json({ ok: false, error: { code: "INVALID", message: "Invalid credentials" } }, { status: 401 });
  const token = await createSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, data: { id: user.id, role: user.role } });
}