import { readFileSync } from "node:fs";
try {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}
import crypto from "node:crypto";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";

async function main() {
  const existing = await db.select().from(schema.users);
  if (existing.length > 0 && !process.env.FORCE_SEED) {
    console.log("Users already exist; skipping seed. Use FORCE_SEED=true to override.");
    process.exit(0);
  }
  // roles
  for (const r of [{ name: "GUEST", level: 0 }, { name: "STUDENT", level: 1 }, { name: "INSTRUCTOR", level: 2 }, { name: "ADMIN", level: 3 }]) {
    try { await db.insert(schema.roles).values(r); } catch {}
  }
  const adminEmail = env.ADMIN_EMAIL || "admin@sentinel.local";
  const adminPass = process.env.ADMIN_PASSWORD || "ChangeMeStrong123!";
  const adminId = crypto.randomUUID();
  const createHash = crypto.createHash.bind(crypto);
  await db.insert(schema.users).values({
    id: adminId,
    email: adminEmail,
    username: "admin",
    passwordHash: await hashPassword(adminPass),
    role: "ADMIN",
    emailVerified: true,
  });
  // sample lab
  await db.insert(schema.labs).values({
    id: crypto.randomUUID(),
    slug: "intro-to-nmap",
    title: "Introduction to Nmap",
    description: "Learn basic port scanning with Nmap.",
    difficulty: "beginner",
    category: "recon",
    content: "# Nmap Basics\n\nRun `nmap -sV target`.",
    published: true,
    xpReward: 100,
    authorId: adminId,
  });
  // sample challenge
  await db.insert(schema.challenges).values({
    id: crypto.randomUUID(),
    slug: "hello-flag",
    title: "Hello Flag",
    description: "Find the flag.",
    category: "misc",
    difficulty: "easy",
    points: 50,
    flagHash: createHash("sha256").update("FLAG{hello}").digest("hex"),
    published: true,
    authorId: adminId,
  });
  // sample tool
  await db.insert(schema.tools).values({
    id: crypto.randomUUID(),
    slug: "nmap",
    name: "Nmap",
    category: "recon",
    description: "Network mapper and port scanner.",
    url: "https://nmap.org",
    tags: JSON.stringify(["recon", "scanning"]),
  });
  // sample badge
  await db.insert(schema.badges).values({
    id: crypto.randomUUID(),
    slug: "first-blood",
    name: "First Blood",
    description: "Solve your first challenge.",
    icon: "🩸",
  });
  console.log("Seed complete. Admin:", adminEmail, "/", adminPass);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
