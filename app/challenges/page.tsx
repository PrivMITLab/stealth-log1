import { db, schema } from "@/lib/db";
export default async function ChallengesPage() {
  const challenges = await db.select().from(schema.challenges);
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Challenges</h1>
      {challenges.length === 0 ? <p className="text-slate-400">No challenges yet.</p> : (
        <div className="grid md:grid-cols-2 gap-6">
          {challenges.map((c: typeof schema.challenges.$inferSelect) => (
            <div key={c.id} className="glass p-6 rounded-2xl">
              <h2 className="font-bold">{c.title}</h2>
              <p className="text-slate-400 text-sm">{c.description}</p>
              <span className="text-xs text-emerald-400">{c.points} pts · {c.difficulty}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}