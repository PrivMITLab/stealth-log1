import { env } from "@/lib/env";

export type DbProvider = "postgres" | "sqlite";

export function resolveProvider(): DbProvider {
  if (env.DATABASE_PROVIDER === "postgres") return "postgres";
  if (env.DATABASE_PROVIDER === "sqlite") return "sqlite";
  const url = env.DATABASE_URL;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return "postgres";
  return "sqlite";
}
