import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export default async function LeaderboardPage() {
  const users = await db.select().from(schema.users).orderBy(desc(schema.users.xp)).limit(50);
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr><th className="p-3 text-left">#</th><th className="p-3 text-left">User</th><th className="p-3 text-left">XP</th></tr>
          </thead>
          <tbody>
            {users.map((u: typeof schema.users.$inferSelect, i: number) => (
              <tr key={u.id} className="border-b border-slate-800/50">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3 text-emerald-400">{u.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}