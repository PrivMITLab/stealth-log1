# 🕵️ Stealth-Log v4.0 — Ethical Hacking College Project

> Visitor-intelligence platform: a "Verifying your connection…" page that collects client + server data, stores it in a database, and exposes an admin dashboard. Built for an ethical-hacking college project / hackathon.

**Org:** PrivMITLab · **License:** MIT · **Version:** 4.0.0

---

## ⚠️ Ethics & Legal Disclaimer

This project captures visitor data. Use **only** on systems you own and with informed consent / legal authorization. Misuse for unauthorized tracking, phishing, or doxxing may violate GDPR, CCPA, IT Act, etc. The maintainers are not responsible for misuse. For a college ethical-hacking demo, always disclose the tracking to participants.

---

## ✨ Features

- **Stealth tracker page** (`/`) — fake "CloudShield Security" verification UI; collects ~60+ client fields + server IP/geo.
- **Multi-database support** — SQLite (default, zero-config) or PostgreSQL via `DB_TYPE` env. Auto-creates tables on startup.
- **Admin dashboard** (`/admin`) — JWT auth, stats cards, charts (countries, browsers), searchable/paginated capture table, detail view, CSV export, delete.
- **Secure config** — all credentials in `.env` (gitignored); helmet, CORS, rate limiting, input size limits, bcrypt passwords, JWT.
- **Optional Discord forwarding** if `DISCORD_WEBHOOK_URL` set.
- **Vercel-ready legacy** `api/track.js` retained.

---

## 📁 Structure

```
stealth-log1/
├── package.json
├── .env.example          # copy to .env
├── .gitignore
├── vercel.json
├── LICENSE
├── public/
│   ├── index.html        # tracker page
│   └── admin.html        # admin dashboard
├── src/
│   ├── server.js         # Express entry
│   ├── db/
│   │   ├── index.js      # adapter selector (sqlite/postgres)
│   │   ├── sqlite.js
│   │   ├── postgres.js
│   │   └── init.js       # seed admin
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── track.js
│   │   └── admin.js
│   └── services/capture.js
└── api/track.js          # legacy Vercel handler
```

---

## 🚀 Quick Start

```bash
cp .env.example .env
# edit .env: set ADMIN_PASSWORD, JWT_SECRET, DB_TYPE, etc.
npm install
npm run init-db
npm start
# open http://localhost:3000        (tracker)
# open http://localhost:3000/admin  (dashboard)
```

Default admin: username from `ADMIN_USERNAME` (default `admin`), password from `ADMIN_PASSWORD`.

### Database selection

| `DB_TYPE` | Required env | Notes |
|---|---|---|
| `sqlite` (default) | `SQLITE_PATH` (default `./data/stealth.db`) | Zero config, file-based |
| `postgres` | `DATABASE_URL` | Auto-creates tables on startup |

Switch by changing `DB_TYPE` and restarting. Tables auto-create.

---

## 🔧 Environment Variables

See `.env.example`. Key ones:

| Var | Description |
|---|---|
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | development/production |
| `DB_TYPE` | `sqlite` or `postgres` |
| `SQLITE_PATH` | SQLite file path |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Long random string for JWT signing |
| `JWT_EXPIRES_IN` | e.g. `8h` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeded admin credentials |
| `DISCORD_WEBHOOK_URL` | Optional Discord forwarding |
| `CORS_ORIGIN` | Allowed origin |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Rate limiting |
| `REDIRECT_URL` | Post-capture redirect target |

**Nothing is hardcoded in the client; all secrets stay server-side. `.env` is gitignored.**

---

## 🔐 Security

- Helmet headers, CORS allowlist, rate limiting, 1MB body limit.
- Passwords hashed with bcrypt; JWT auth for admin API.
- All DB queries parameterized (no SQL injection).
- `.env` gitignored; `.env.example` has placeholders only.
- `X-Robots-Tag: noindex` on all routes (vercel.json).

---

## 📊 Data Collected

Client: screen, device, GPU, connection, battery, canvas/audio fingerprint, fonts, ad-blocker, visit tracking, media devices, dark mode, languages, timezone, referrer, URL, UA, client hints, parsed browser/OS/device.

Server: IP, geo (ip-api + ipinfo + Vercel headers), ISP, org, AS, proxy/hosting/mobile flags, security classification, map link.

---

## 🔗 Tracking Links

Instead of tracking on `/`, create **tracking links** from the admin dashboard:

- Each link has a slug, custom redirect URL, optional expiry (datetime) and max visits.
- Public URL: `/t/:slug` — serves the tracker page with Open Graph tags (title/description/image) for social previews.
- Visit counts increment; expired/maxed links show "Link Expired".
- Captures are tagged with `linkId` for per-link analytics.

## 🛠️ Admin API (JWT required)

- `POST /api/auth/login` → `{ token }`
- `GET /api/admin/stats` → totals, today, unique IPs, top countries/browsers/OS/devices
- `GET /api/admin/captures?limit&offset&search`
- `GET /api/admin/captures/:id`
- `DELETE /api/admin/captures/:id`
- `DELETE /api/admin/captures` (clear all)
- `GET /api/admin/export.csv`
- `GET /api/admin/links` / `POST /api/admin/links` / `PUT /api/admin/links/:id` / `DELETE /api/admin/links/:id`
- `GET /api/admin/links/:id/stats`

---

## 🧪 Dev

```bash
npm run dev          # watch mode
npm run init-db      # seed admin + verify DB
```

---

## 📜 License

MIT © 2026 PrivMITLab.
