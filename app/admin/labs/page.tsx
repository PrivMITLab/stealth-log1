import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function AdminLabsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");
  return <main className="min-h-screen p-8 max-w-6xl mx-auto"><h1 className="text-3xl font-bold">Labs (admin)</h1><p className="text-slate-400 mt-2">CRUD coming soon.</p></main>;
}