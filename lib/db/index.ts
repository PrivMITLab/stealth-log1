import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env, getBaseUrl } from "@/lib/env";
import { resolveProvider } from "@/lib/db/provider";

const provider = resolveProvider();

let db: any;
let schema: any;

if (provider === "postgres") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/node-postgres");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  db = drizzle(pool);
  schema = require("@/lib/db/schema.pg");
} else {
  mkdirSync(dirname(env.DATABASE_URL.replace(/^file:/, "").replace(/^sqlite:/, "")), { recursive: true });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const file = env.DATABASE_URL.replace(/^file:/, "").replace(/^sqlite:/, "");
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  db = drizzle(sqlite);
  schema = require("@/lib/db/schema.sqlite");
}

export { db, schema, provider };
export type DbType = typeof db;
