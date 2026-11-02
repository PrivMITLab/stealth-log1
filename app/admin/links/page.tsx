"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type LinkRow = { id: string; slug: string; title: string; destinationUrl: string; active: boolean; clickCount: number; maxClicks: number | null; expiresAt: string | null };

export default function AdminLinksPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [title, setTitle] = useState("");
  const [dest, setDest] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/links");
    const json = await res.json();
    if (json.ok) setLinks(json.data);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/v1/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, destinationUrl: dest, slug: slug || undefined }) });
    setTitle(""); setDest(""); setSlug("");
    setLoading(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete link?")) return;
    await fetch(`/api/v1/links/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Links Tracker</h1>
        <Link href="/admin" className="text-emerald-400">← Admin</Link>
      </div>
      <form onSubmit={create} className="glass p-6 rounded-2xl mb-8 grid md:grid-cols-4 gap-3">
        <input className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2" placeholder="Destination URL" value={dest} onChange={(e) => setDest(e.target.value)} required />
        <input className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <button disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium">{loading ? "…" : "Create"}</button>
      </form>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Short URL</th>
              <th className="text-left p-3">Destination</th>
              <th className="text-left p-3">Clicks</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id} className="border-b border-slate-800/50">
                <td className="p-3">{l.title}</td>
                <td className="p-3 font-mono text-xs">{typeof window !== "undefined" ? `${window.location.origin}/r/${l.slug}` : `/r/${l.slug}`}</td>
                <td className="p-3 text-xs truncate max-w-xs">{l.destinationUrl}</td>
                <td className="p-3">{l.clickCount}{l.maxClicks ? `/${l.maxClicks}` : ""}</td>
                <td className="p-3">
                  <button onClick={() => remove(l.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {links.length === 0 && <p className="p-6 text-slate-500 text-center">No links yet.</p>}
      </div>
    </main>
  );
}