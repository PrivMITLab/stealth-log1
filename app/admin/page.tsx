import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-slate-400 mb-8">Manage content, users, and links.</p>
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/admin/links" className="glass p-6 rounded-2xl">🔗 Links Tracker</Link>
        <Link href="/admin/labs" className="glass p-6 rounded-2xl">🧪 Labs</Link>
        <Link href="/admin/challenges" className="glass p-6 rounded-2xl">🚩 Challenges</Link>
        <Link href="/admin/users" className="glass p-6 rounded-2xl">👥 Users</Link>
        <Link href="/admin/audit" className="glass p-6 rounded-2xl">📜 Audit Log</Link>
        <Link href="/admin/settings" className="glass p-6 rounded-2xl">⚙️ Settings</Link>
      </div>
    </main>
  );
}