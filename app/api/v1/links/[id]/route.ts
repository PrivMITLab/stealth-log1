import { NextResponse } from "next/server";
import { getSessionUser, hasRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, "ADMIN")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
  const rows = await db.select().from(schema.links).where(eq(schema.links.id, id));
  if (!rows.length) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
  return NextResponse.json({ ok: true, data: rows[0] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, "ADMIN")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
  const body = await req.json();
  await db.update(schema.links).set(body).where(eq(schema.links.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, "ADMIN")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
  await db.delete(schema.linkClicks).where(eq(schema.linkClicks.linkId, id));
  await db.delete(schema.links).where(eq(schema.links.id, id));
  return NextResponse.json({ ok: true });
}