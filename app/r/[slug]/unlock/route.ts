import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const rows = await db.select().from(schema.links).where(eq(schema.links.slug, slug));
  const link = rows[0];
  if (!link || !link.passwordHash) return NextResponse.redirect(new URL(`/r/${slug}`, req.url));
  const ok = await verifyPassword(link.passwordHash, password);
  if (!ok) return NextResponse.redirect(new URL(`/r/${slug}?err=1`, req.url));
  const res = NextResponse.redirect(new URL(link.destinationUrl, req.url));
  res.cookies.set(`link_${link.id}`, "1", { httpOnly: true, path: "/", maxAge: 3600 });
  return res;
}
