# The Pancake Club production runbook

Use this checklist for every production release and for the final client handover.

## 1. Required infrastructure

- Vercel production project connected to `www.thepancakeclub.com.au`.
- Railway backend connected to a persistent Postgres service through `DATABASE_URL`.
- Railway health check points to `/api/health/`.
- Daily Postgres backups are enabled and a restore has been tested.
- Brevo sender domain passes SPF and DKIM; DMARC is published for the domain.
- An external uptime monitor checks both the homepage and backend health endpoint.

Never run `seed_demo` against production. It is only for an empty development
database and now refuses non-empty databases unless `--force` is explicitly used.

## 2. Required production variables

Frontend (Vercel):

- `NEXT_PUBLIC_SITE_URL=https://www.thepancakeclub.com.au`
- `NEXT_PUBLIC_API_URL=https://<railway-backend>/api`
- Cloudinary cloud name and restricted unsigned upload preset
- Maintenance mode and a strong bypass secret when maintenance access is required

Backend (Railway):

- `DATABASE_URL` from the linked Postgres service
- `DJANGO_DEBUG=0`
- strong unique `DJANGO_SECRET_KEY`
- exact backend hostname in `DJANGO_ALLOWED_HOSTS`
- both canonical/apex website origins in `DJANGO_CORS_ORIGINS`
- both canonical/apex website origins in `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_FRONTEND_URL=https://www.thepancakeclub.com.au`
- `DJANGO_EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, and verified `DJANGO_FROM_EMAIL`

Stripe variables stay unset while orders are paid at the counter.

## 3. Safe deployment order

1. Take a database backup.
2. Deploy the backend; migrations run before Gunicorn starts.
3. Confirm `GET /api/health/` returns `{"status":"ok"}`.
4. Confirm public and admin API reads return expected production data.
5. Deploy the frontend.
6. Delete any old duplicate campaigns once. Restart the backend and confirm they stay deleted.
7. Complete the smoke test below.

## 4. Production smoke test

- Homepage, menu, dish page, gallery, booking, club and privacy pages load on mobile and desktop.
- Menu/category/gallery/campaign changes appear publicly after an admin save.
- A deleted campaign remains deleted after refresh and backend restart.
- Place a test pickup order; verify customer and staff messages, totals and pay-at-counter copy.
- Move the test order through preparing, ready and cancelled; verify the correct emails.
- Submit and confirm/cancel a booking with a preselected menu item.
- Join the club with and without optional marketing consent.
- Submit a review and approve it from admin.
- Upload/replace an image and confirm its crop on mobile, tablet and desktop previews.
- Verify the admin is inaccessible without a staff token.
- Check sitemap, robots, canonical metadata and Search Console status.

Remove or clearly label all test orders, bookings, members and reviews afterwards.

## 5. Client handover

- Create a named staff account with a unique password; disable demo/shared credentials.
- Verify the final address, phone, email, ABN, opening hours, social links and factual claims.
- Give the client a recorded walkthrough of orders, bookings, menu, campaigns, reviews and content.
- Record who owns Vercel, Railway, Postgres, Cloudinary, Brevo, DNS and Search Console.
- Document support contacts, backup recovery and the maintenance-mode procedure.
- Review monitoring and backups monthly; install dependency/security updates on a regular schedule.
