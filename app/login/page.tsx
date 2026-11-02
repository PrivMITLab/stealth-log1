"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) { setError(json.error?.message || "Login failed"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass w-full max-w-md p-8 space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-medium disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-slate-400">No account? <Link href="/register" className="text-emerald-400">Register</Link></p>
      </form>
    </main>
  );
}