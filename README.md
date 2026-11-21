# Sentinel — Ethical Hacking Learning Platform

Next.js 15 (App Router) + Drizzle (SQLite/Postgres) + argon2 auth + RBAC + links tracker.

## Setup

```bash
cp .env.example .env
# edit .env: set APP_URL, AUTH_SECRET (32+ chars), ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Seed admin credentials
- Email: value of `ADMIN_EMAIL` (default admin@sentinel.local)
- Password: value of `ADMIN_PASSWORD` (default ChangeMeStrong123!)

## Scripts
- `npm run dev` — dev server
- `npm run build && npm start` — production
- `npm run db:push` — push schema
- `npm run db:seed` — seed (idempotent unless FORCE_SEED=true)
- `npm run typecheck` — tsc
- `npm run lint` — eslint

## Database
`DATABASE_URL` prefix decides provider: `postgres://` → pg, `file:`/`sqlite:` → sqlite.
`DATABASE_PROVIDER=auto|postgres|sqlite`.

## Docker
`docker compose up -d db` for Postgres 16.

## Notes
- `/r/{slug}` is the short link redirect (logs clicks).
- Admin panel at `/admin` (ADMIN role required).
- `/api/health`, `/api/ready`.
- `legacy-express/` holds the archived Express v4 stack (tracker + SQLite/Postgres admin).
  It is not loaded by Next.js and is kept for reference only.
- Seed creates: 4 roles, admin user, sample lab/challenge/tool/badge.
