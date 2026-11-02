import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user.username}</h1>
      <p className="text-slate-400 mb-8">Role: {user.role} · XP: {user.xp}</p>
      <div className="grid md:grid-cols-3 gap-6">
        <a href="/labs" className="glass p-6 rounded-2xl hover:border-emerald-500/40">🧪 Labs</a>
        <a href="/challenges" className="glass p-6 rounded-2xl hover:border-emerald-500/40">🚩 Challenges</a>
        <a href="/leaderboard" className="glass p-6 rounded-2xl hover:border-emerald-500/40">🏆 Leaderboard</a>
      </div>
    </main>
  );
}