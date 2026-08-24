# The Pancake Club 🥞

Full-stack website + management system for a pancake restaurant.

| Piece | Stack | Where |
|---|---|---|
| Public storefront | Next.js (App Router) + TypeScript, hand-crafted CSS design system | `app/(site)` |
| Admin panel (`/admin`) | Next.js + Tailwind v4 + shadcn-style components | `app/(admin)` |
| REST API | Django 5.2 LTS + Django REST Framework | `backend/` |

The storefront and admin live in the **same Next.js app** under two isolated
root layouts — the admin's Tailwind never touches the storefront's retro CSS.

## Run it (two terminals)

```bash
# 1 — backend API  (first time: see backend/README.md for setup)
cd backend
.venv/bin/python manage.py runserver 8000

# 2 — frontend
npm install
npm run dev            # http://localhost:3000
```

- Storefront: <http://localhost:3000> · Admin panel: <http://localhost:3000/admin>
- Django admin (backup tooling): <http://localhost:8000/admin/>
- Copy `.env.example` → `.env.local` for optional config (Cloudinary uploads, site URL).
- The storefront still renders (with fallback content, ordering paused) if the
  backend is down.

## Tests

```bash
cd backend && .venv/bin/python manage.py test   # API/unit suite
npm run test:e2e                                # Playwright smoke (needs both servers seeded)
```

CI (GitHub Actions) runs backend tests, a production build and the e2e smoke
suite on every push/PR — see `.github/workflows/ci.yml`.

## Project map

```
app/(site)/        storefront pages (home, menu, gallery, booking, privacy)
app/(admin)/admin/ admin panel (dashboard, orders, bookings, menu, reviews,
                   site content, settings) — token login, staff only
components/        storefront components · components/ui/ = admin primitives
lib/api.ts         typed public-API client (server components, with fallbacks)
lib/admin-api.ts   typed staff-API client (browser, token auth)
app/globals.css    storefront design system (tokens, elevation, motion)
backend/           Django project — see backend/README.md for API docs
e2e/               Playwright smoke suite
```

## Content & operations

Everything editable lives in the admin panel: menu (CRUD + featured/availability),
orders (live alerts, status flow, cancel-with-reason), bookings (confirm/decline,
phone bookings), review moderation, gallery, certifications, announcement bar,
hero/about copy, contact details, opening hours, timezone. Customer emails
(order/booking lifecycle) send automatically — console backend in dev, SMTP via
env in production.

## Deploying

Frontend → Vercel; backend + Postgres → Railway/Render. Set the env vars listed
in `backend/README.md` (secret key, hosts, CORS, SMTP) and `NEXT_PUBLIC_API_URL`
on the frontend. Change the default admin password before launch.
