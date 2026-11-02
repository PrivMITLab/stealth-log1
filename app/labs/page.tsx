import { db, schema } from "@/lib/db";
export default async function LabsPage() {
  const labs = await db.select().from(schema.labs);
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Labs</h1>
      {labs.length === 0 ? <p className="text-slate-400">No labs yet.</p> : (
        <div className="grid md:grid-cols-2 gap-6">
          {labs.map((l: typeof schema.labs.$inferSelect) => (
            <div key={l.id} className="glass p-6 rounded-2xl">
              <h2 className="font-bold">{l.title}</h2>
              <p className="text-slate-400 text-sm">{l.description}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}