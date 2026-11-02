import { db, schema } from "@/lib/db";
export default async function ToolsPage() {
  const tools = await db.select().from(schema.tools);
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tools</h1>
      {tools.length === 0 ? <p className="text-slate-400">No tools yet.</p> : (
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((t: typeof schema.tools.$inferSelect) => (
            <div key={t.id} className="glass p-6 rounded-2xl">
              <h2 className="font-bold">{t.name}</h2>
              <p className="text-slate-400 text-sm">{t.description}</p>
              <span className="text-xs text-emerald-400">{t.category}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}