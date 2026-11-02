import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    await db.execute?.((await import("drizzle-orm")).sql`SELECT 1`);
    return NextResponse.json({ ok: true, status: "ready" });
  } catch (e) {
    return NextResponse.json({ ok: false, status: "not ready" }, { status: 503 });
  }
}