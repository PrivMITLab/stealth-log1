import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/env";
import crypto from "node:crypto";

async function logClick(linkId: string, reqHeaders: Headers) {
  try {
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || reqHeaders.get("x-real-ip") || "unknown";
    const ipHash = crypto.createHash("sha256").update(ip + (process.env.AUTH_SECRET || "salt")).digest("hex");
    const ua = reqHeaders.get("user-agent") || "";
    await db.insert(schema.linkClicks).values({
      id: crypto.randomUUID(),
      linkId,
      ipHash,
      referrer: reqHeaders.get("referer") || null,
    });
    await db.update(schema.links).set({ clickCount: (await db.select().from(schema.links).where(eq(schema.links.id, linkId)))[0].clickCount + 1 }).where(eq(schema.links.id, linkId));
  } catch {}
}

export default async function RedirectPage({ params, searchParams }: { params: { slug: string }; searchParams: { p?: string } }) {
  const h = await headers();
  const rows = await db.select().from(schema.links).where(eq(schema.links.slug, params.slug));
  const link = rows[0];
  if (!link) return <div className="p-8 text-center">Link not found.</div>;
  if (!link.active) return <div className="p-8 text-center">This link is disabled.</div>;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return <div className="p-8 text-center">This link has expired.</div>;
  if (link.maxClicks && link.clickCount >= link.maxClicks) return <div className="p-8 text-center">This link has reached its click limit.</div>;

  // password gate
  if (link.passwordHash) {
    const cookie = h.get("cookie") || "";
    const authed = cookie.includes(`link_${link.id}=1`);
    if (!authed) {
      // check submitted password via searchParams? handle via form POST instead
      return (
        <main className="min-h-screen flex items-center justify-center p-4">
          <form method="POST" action={`/r/${params.slug}/unlock`} className="glass p-8 space-y-4 w-full max-w-md">
            <h1 className="text-xl font-bold">Password required</h1>
            <input name="password" type="password" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" />
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg">Continue</button>
          </form>
        </main>
      );
    }
  }

  if (link.interstitial) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-2">{link.title}</h1>
          <p className="text-slate-400 mb-6">You are being redirected to {new URL(link.destinationUrl).hostname}</p>
          <a href={link.destinationUrl} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-semibold inline-block">
            Continue
          </a>
        </div>
      </main>
    );
  }

  await logClick(link.id, h);
  redirect(link.destinationUrl);
}