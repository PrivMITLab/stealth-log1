import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-6">
        <div className="font-bold text-lg">🛡️ Sentinel</div>
        <Link href="/admin" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-medium">
          Admin →
        </Link>
      </nav>
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-300 text-xs mb-6">
          Ethical Hacking Learning Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Learn. Hack. <span className="text-emerald-400">Level Up.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Guided labs, CTF challenges, roadmaps, tools, writeups, XP & leaderboard.
          Built for college hackathons.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-semibold">
            Get Started
          </Link>
          <Link href="/labs" className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-semibold">
            Browse Labs
          </Link>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: "🧪", title: "Labs", desc: "Step-by-step guided tasks with terminal output." },
          { icon: "🚩", title: "CTF", desc: "Flag submission, first-blood, XP hints." },
          { icon: "🗺️", title: "Roadmaps", desc: "Interactive node graphs." },
          { icon: "🛠️", title: "Tools", desc: "Curated tool directory." },
          { icon: "📝", title: "Writeups", desc: "Community writeups with votes." },
          { icon: "🏆", title: "Leaderboard", desc: "Daily, weekly, all-time." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}