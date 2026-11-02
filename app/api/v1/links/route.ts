import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, hasRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/env";
import crypto from "node:crypto";

const createSchema = z.object({
  title: z.string().min(1),
  destinationUrl: z.string().url(),
  slug: z.string().min(3).max(32).optional(),
  redirectType: z.union([z.literal(302), z.literal(307)]).default(302),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
  maxClicks: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  interstitial: z.boolean().default(false),
  password: z.string().optional(),
});

function genSlug() {
  return crypto.randomBytes(4).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 7);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, "ADMIN")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
  const rows = await db.select().from(schema.links);
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !hasRole(user.role, "ADMIN")) return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Invalid", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  const d = parsed.data;
  const slug = (d.slug && d.slug.trim()) ? d.slug.trim().toLowerCase() : genSlug();
  // SSRF guard: block private ranges in destination
  try {
    const u = new URL(d.destinationUrl);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad protocol");
    const host = u.hostname;
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|localhost|0\.0\.0\.0)/.test(host)) throw new Error("private");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_DEST", message: "Invalid or unsafe destination URL" } }, { status: 400 });
  }
  const id = crypto.randomUUID();
  let passwordHash: string | null = null;
  if (d.password) {
    const { hashPassword } = await import("@/lib/auth");
    passwordHash = await hashPassword(d.password);
  }
  await db.insert(schema.links).values({
    id, slug, title: d.title, destinationUrl: d.destinationUrl, redirectType: d.redirectType,
    active: d.active, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null, maxClicks: d.maxClicks ?? null,
    tags: JSON.stringify(d.tags), notes: d.notes ?? null, utmSource: d.utmSource ?? null,
    utmMedium: d.utmMedium ?? null, utmCampaign: d.utmCampaign ?? null, interstitial: d.interstitial,
    passwordHash, createdById: user.id,
  });
  const shortUrl = `${getBaseUrl()}/r/${slug}`;
  return NextResponse.json({ ok: true, data: { id, slug, shortUrl } });
}