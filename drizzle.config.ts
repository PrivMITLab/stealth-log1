import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config();
const url = process.env.DATABASE_URL || "file:./data/app.db";
const isPg = url.startsWith("postgres://") || url.startsWith("postgresql://");
export default defineConfig({
  schema: isPg ? "./lib/db/schema.pg.ts" : "./lib/db/schema.sqlite.ts",
  out: "./drizzle",
  dialect: isPg ? "postgresql" : "sqlite",
  dbCredentials: isPg ? { url } : { url: url.replace(/^file:/, "").replace(/^sqlite:/, "") },
});