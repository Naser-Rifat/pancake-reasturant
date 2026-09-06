#!/bin/zsh
# One-command local payment stack: Django + Stripe webhook forwarder + Next.
# Run from anywhere:  zsh backend/local-payments.sh
# Stop everything:    zsh backend/local-payments.sh stop
# Logs: /tmp/django-dev.log  /tmp/stripe-listen.log  /tmp/next-dev-local.log

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STRIPE_BIN="$HOME/.local/bin/stripe"

kill_all() {
  lsof -ti:8000 | xargs kill 2>/dev/null
  lsof -ti:3000 | xargs kill 2>/dev/null
  pkill -f "stripe listen" 2>/dev/null
  sleep 1
}

if [[ "$1" == "stop" ]]; then
  kill_all
  echo "🛑 Local payment stack stopped."
  echo "   (Plain site chalate: npm run dev — prod API-r against e, order test korben na!)"
  exit 0
fi

kill_all

SK=$(grep '^STRIPE_SECRET_KEY=' "$REPO/backend/.env" | cut -d= -f2)
if [[ -z "$SK" ]]; then echo "STRIPE_SECRET_KEY missing in backend/.env"; exit 1; fi

# webhook secret can rotate every ~90 days — refresh it in .env each start
WHSEC=$("$STRIPE_BIN" listen --print-secret --api-key "$SK" 2>/dev/null)
if [[ "$WHSEC" == whsec_* ]]; then
  sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WHSEC|" "$REPO/backend/.env"
fi

echo "▶ Django (8000)…"
(cd "$REPO/backend" && nohup .venv/bin/python manage.py runserver 8000 > /tmp/django-dev.log 2>&1 &)

echo "▶ Stripe webhook forwarder…"
nohup "$STRIPE_BIN" listen --api-key "$SK" \
  --forward-to localhost:8000/api/webhooks/stripe/ > /tmp/stripe-listen.log 2>&1 &

echo "▶ Next.js (3000, LOCAL backend)…"
(cd "$REPO" && NEXT_PUBLIC_API_URL=http://localhost:8000/api nohup npm run dev > /tmp/next-dev-local.log 2>&1 &)

sleep 6
D=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/site/)
N=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo ""
echo "Django: $D   Next: $N   (duitai 200 hole ready)"
echo ""
echo "🥞 Site:   http://localhost:3000/menu"
echo "🔑 Admin:  http://localhost:3000/admin  (admin / demo-pass-123)"
echo "💳 Card:   4242 4242 4242 4242 · 12/30 · CVC 123 · postcode 2000"
echo "   Declined test: 4000 0000 0000 0002"
echo ""
echo "⚠️  Ei stack e ja korben sob LOCAL — production chhoy na."
