# KRUSH Backend — Django REST API

REST API for the KRUSH pancake restaurant storefront (Next.js app in the repo root).

## Stack

- Django 5.2 LTS + Django REST Framework
- SQLite in development (swap `DATABASES` for Postgres in production)
- `django-cors-headers` configured for the Next.js dev server on port 3000

## Setup

```bash
cd backend
python3.12 -m venv .venv  # needs Python 3.10+ (Django 5.2)
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo        # demo content matching the storefront
# ⚠️ seed_demo resets the seeded items to their demo values — run it ONCE at
# setup. Re-running later will overwrite any staff edits to those items.
.venv/bin/python manage.py createsuperuser  # for /admin/
.venv/bin/python manage.py runserver 8000
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/menu/` | Available menu items. `?featured=1`, `?tag=sweet\|savoury\|choc` |
| GET | `/api/menu/<slug>/` | Single menu item |
| POST | `/api/orders/` | Place a pickup order (see body below) |
| GET | `/api/orders/<public_id>/` | Order status + line items |
| POST | `/api/bookings/` | Request a table booking (created as `pending`) |
| GET | `/api/bookings/<public_id>/` | Booking status |
| GET | `/api/reviews/` | Approved reviews (paginated) |
| POST | `/api/reviews/` | Submit a review — held for moderation |
| GET | `/api/gallery/` | Gallery photos. `?album=food\|interior\|events` |
| GET | `/api/announcement/` | Active announcement bar message (204 if none) |
| GET | `/api/hours/` | Opening hours |

### Staff-only admin API (consumed by the Next.js `/admin` panel)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/admin/login/` | Staff credentials → API token (rate-limited 20/h) |
| GET | `/api/admin/stats/` | Dashboard stats |
| GET/PATCH | `/api/admin/orders/…` | List orders, update status |
| GET/PATCH | `/api/admin/bookings/…` | List bookings, confirm/cancel |
| GET/PATCH/DELETE | `/api/admin/reviews/…` | Moderate reviews |
| CRUD | `/api/admin/menu/…` | Manage menu items |

All admin endpoints require `Authorization: Token <token>` from a staff account.

### Place an order

```json
{
  "customer_name": "Alex",
  "phone": "0400 000 000",
  "items": [
    {"slug": "berry", "quantity": 2},
    {"slug": "choc", "quantity": 1}
  ]
}
```

Prices are snapshotted server-side from the menu at order time — the client
never sends amounts. The response includes `public_id` for status polling and
the computed `total`.

### Booking rules

- Date/time must not be in the past (validated in `Australia/Sydney` time)
- Party size 1–20; groups of 10+ are asked to call in the storefront UI

## Moderation & operations

Day-to-day management happens in the custom admin panel at `/admin` on the
storefront (orders, bookings, reviews, menu). The Django admin (`:8000/admin/`)
remains available for everything else (gallery, announcements, hours, users).

Write endpoints are rate-limited per IP (bookings 10/h, orders 30/h,
reviews 5/h, staff login 20/h).

## Customer emails

Changing a booking to **confirmed/cancelled**, or an order to **ready/cancelled**,
automatically emails the customer. In development the email is printed to the
`runserver` console (no setup needed). For production, set:

```ini
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DJANGO_EMAIL_HOST=smtp.gmail.com        # or Resend/Brevo SMTP host
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_USER=you@gmail.com
DJANGO_EMAIL_PASSWORD=your-app-password
DJANGO_FROM_EMAIL="KRUSH Pancakes <hello@krushpancakes.com.au>"
```

Send failures are logged and never block the status change itself.

## Tests

```bash
.venv/bin/python manage.py test
```

## Production notes

- Set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS`,
  `DJANGO_CORS_ORIGINS` (comma-separated)
- Run behind gunicorn/uvicorn + a reverse proxy; `STATIC_ROOT` is configured
  for `collectstatic`
- SQLite → Postgres: change `DATABASES` or wire `dj-database-url`
- Rotate the dev admin password (`krush2026`) before launch
