import hashlib
import hmac
import json
import time
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Booking, Coupon, MenuItem, Order, Review

# Orders are pay-first: POST /orders/ opens a Stripe Checkout Session and the
# order stays pending_payment until the webhook confirms the money. Two things
# follow for these tests.
#
# One: nothing here may touch the network. Every order test used to call the
# real Stripe API, which made the suite slow, offline-hostile, and dependent on
# a key being present in the environment.
#
# Two: an order only becomes the kitchen's business — visible to staff, worth
# emailing about — after the webhook. So a test that wants a real order has to
# place it AND pay it.

WEBHOOK_SECRET = "whsec_test_suite"


def place_order(client, payload, format="json"):
    """POST an order with Stripe stubbed out."""
    with patch("core.payments.create_checkout_session", return_value="https://stripe.test/pay"):
        return client.post("/api/orders/", payload, format=format)


@override_settings(STRIPE_WEBHOOK_SECRET=WEBHOOK_SECRET)
def pay_order(client, public_id, event="checkout.session.completed"):
    """Drive the real webhook view, signature and all.

    Signing a payload rather than calling the private handler means these tests
    also cover the signature check and the URL wiring — the two pieces that,
    if misconfigured in production, take a customer's money and never tell the
    kitchen.
    """
    order = Order.objects.get(public_id=public_id)
    order.stripe_session_id = order.stripe_session_id or f"cs_test_{order.pk}"
    order.save(update_fields=["stripe_session_id"])
    payload = json.dumps({
        "id": "evt_test",
        "object": "event",
        "type": event,
        "data": {"object": {
            "id": order.stripe_session_id,
            "object": "checkout.session",
            "payment_status": "paid",
            "payment_intent": "pi_test",
            "metadata": {"order_public_id": str(order.public_id)},
        }},
    })
    ts = str(int(time.time()))
    sig = hmac.new(
        WEBHOOK_SECRET.encode(), f"{ts}.{payload}".encode(), hashlib.sha256
    ).hexdigest()
    res = client.post(
        "/api/webhooks/stripe/",
        data=payload,
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE=f"t={ts},v1={sig}",
    )
    order.refresh_from_db()
    return res, order


def make_item(slug="berry", price="17.00", **kwargs):
    defaults = dict(
        name=slug.title(), description="d", price=Decimal(price), tag="sweet",
    )
    defaults.update(kwargs)
    return MenuItem.objects.create(slug=slug, **defaults)


class MenuApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_lists_only_available_items(self):
        make_item("berry")
        make_item("gone", is_available=False)
        res = self.client.get("/api/menu/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual([i["slug"] for i in res.json()], ["berry"])

    def test_featured_filter(self):
        make_item("berry", is_featured=True)
        make_item("choc")
        res = self.client.get("/api/menu/?featured=1")
        self.assertEqual([i["slug"] for i in res.json()], ["berry"])


class OrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        make_item("berry", price="17.00")
        make_item("choc", price="18.00")

    def test_create_order_snapshots_prices_server_side(self):
        res = place_order(
            self.client,
            {
                "customer_name": "Alex",
                "items": [
                    {"slug": "berry", "quantity": 2},
                    {"slug": "choc", "quantity": 1},
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(Decimal(body["total"]), Decimal("52.00"))
        # pay-first: the order waits for Stripe and is not the kitchen's yet
        self.assertEqual(body["status"], "pending_payment")
        self.assertEqual(body["payment_status"], "unpaid")
        self.assertTrue(body["checkout_url"])
        # order is retrievable by public id
        res2 = self.client.get(f"/api/orders/{body['public_id']}/")
        self.assertEqual(res2.status_code, 200)

    def test_order_placement_sends_confirmation_with_abn(self):
        from django.core import mail

        res = place_order(
            self.client,
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        # nothing is sent yet: an unpaid order is not an order
        self.assertEqual(len(mail.outbox), 0)

        pay_order(self.client, res.json()["public_id"])
        # one confirmation to the customer, one heads-up to staff
        self.assertEqual(len(mail.outbox), 2)
        customer_mail = next(m for m in mail.outbox if "alex@example.com" in m.to)
        self.assertIn("got your order", customer_mail.subject)
        self.assertIn("ABN", customer_mail.body)
        self.assertIn("incl. GST", customer_mail.body)
        staff_mail = next(m for m in mail.outbox if "alex@example.com" not in m.to)
        self.assertIn("New pickup order", staff_mail.subject)

    def test_cancel_with_reason_emails_customer(self):
        from django.contrib.auth.models import User
        from django.core import mail

        order = place_order(
            self.client,
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        ).json()
        # staff never see an unpaid order — pay it the way Stripe would
        pay_order(self.client, order["public_id"])
        mail.outbox.clear()
        User.objects.create_user("chef", password="pw", is_staff=True)
        token = self.client.post(
            "/api/admin/login/", {"username": "chef", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        # cancelling a paid order refunds it; the refund itself is Stripe's job
        with patch("core.payments.refund_order") as refund:
            res = self.client.patch(
                f"/api/admin/orders/{order['public_id']}/",
                {"status": "cancelled", "cancel_reason": "Out of blueberries tonight"},
                format="json",
            )
        self.assertEqual(res.status_code, 200, res.content)
        refund.assert_called_once()
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Out of blueberries tonight", mail.outbox[0].body)

    def test_rejects_oversized_orders(self):
        res = place_order(
            self.client,
            {
                "customer_name": "Alex",
                "items": [
                    {"slug": "berry", "quantity": 20},
                    {"slug": "choc", "quantity": 20},
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)  # 40 items: allowed
        res = place_order(
            self.client,
            {
                "customer_name": "Alex",
                "items": [
                    {"slug": "berry", "quantity": 20},
                    {"slug": "choc", "quantity": 20},
                    {"slug": "banana", "quantity": 20},
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)  # 60 items: rejected

    def test_rejects_unknown_or_empty_items(self):
        res = place_order(
            self.client,
            {"customer_name": "Alex", "items": [{"slug": "nope", "quantity": 1}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        res = place_order(
            self.client, {"customer_name": "Alex", "items": []}, format="json"
        )
        self.assertEqual(res.status_code, 400)


class BookingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_rejects_past_date(self):
        yesterday = timezone.localdate() - timedelta(days=1)
        res = self.client.post(
            "/api/bookings/",
            {
                "name": "Alex", "email": "a@b.co", "date": str(yesterday),
                "time": "18:00", "party_size": 2,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_creates_pending_booking(self):
        tomorrow = timezone.localdate() + timedelta(days=1)
        res = self.client.post(
            "/api/bookings/",
            {
                "name": "Alex", "email": "a@b.co", "date": str(tomorrow),
                "time": "18:00", "party_size": 4,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()["status"], "pending")


class AdminApiTests(TestCase):
    def setUp(self):
        from django.contrib.auth.models import User

        self.client = APIClient()
        self.staff = User.objects.create_user("boss", password="pw", is_staff=True)
        self.customer = User.objects.create_user("guest", password="pw")
        make_item("berry", price="17.00")

    def login(self, username):
        res = self.client.post(
            "/api/admin/login/", {"username": username, "password": "pw"}, format="json"
        )
        return res

    def test_login_requires_staff(self):
        self.assertEqual(self.login("boss").status_code, 200)
        self.assertEqual(self.login("guest").status_code, 400)

    def test_login_is_throttled_against_brute_force(self):
        from django.core.cache import cache

        cache.clear()  # isolate the throttle bucket from other tests
        self.addCleanup(cache.clear)
        for _ in range(20):
            res = self.client.post(
                "/api/admin/login/", {"username": "boss", "password": "nope"}, format="json"
            )
            self.assertEqual(res.status_code, 400)
        res = self.client.post(
            "/api/admin/login/", {"username": "boss", "password": "nope"}, format="json"
        )
        self.assertEqual(res.status_code, 429)

    def test_admin_endpoints_reject_anonymous(self):
        self.assertEqual(self.client.get("/api/admin/orders/").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/stats/").status_code, 401)

    def test_staff_can_advance_order_status(self):
        order = place_order(
            self.client,
            {"customer_name": "Alex", "items": [{"slug": "berry", "quantity": 1}]},
            format="json",
        ).json()
        pay_order(self.client, order["public_id"])
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.patch(
            f"/api/admin/orders/{order['public_id']}/", {"status": "preparing"}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["status"], "preparing")

    def test_confirming_booking_emails_the_customer(self):
        from django.core import mail

        booking = Booking.objects.create(
            name="Sam", email="sam@example.com", date="2030-01-15",
            time="18:30", party_size=4,
        )
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.patch(
            f"/api/admin/bookings/{booking.public_id}/", {"status": "confirmed"}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["sam@example.com"])
        self.assertIn("confirmed", mail.outbox[0].subject.lower())
        # saving again with the same status must NOT re-send
        self.client.patch(
            f"/api/admin/bookings/{booking.public_id}/", {"status": "confirmed"}, format="json"
        )
        self.assertEqual(len(mail.outbox), 1)

    def test_order_ready_emails_customer_when_email_given(self):
        from django.core import mail

        order = place_order(
            self.client,
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        ).json()
        pay_order(self.client, order["public_id"])
        mail.outbox.clear()  # drop the payment-confirmation emails
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.client.patch(f"/api/admin/orders/{order['public_id']}/", {"status": "preparing"}, format="json")
        self.assertEqual(len(mail.outbox), 0)  # intermediate statuses are silent
        self.client.patch(f"/api/admin/orders/{order['public_id']}/", {"status": "ready"}, format="json")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["alex@example.com"])
        self.assertIn("ready", mail.outbox[0].subject.lower())

    def test_phone_booking_with_email_sends_confirmation(self):
        from django.core import mail

        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.post(
            "/api/admin/bookings/",
            {
                "name": "Phone Guest", "phone": "0400 999 888", "email": "guest@example.com",
                "date": "2030-01-15", "time": "19:00", "party_size": 4, "status": "confirmed",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["guest@example.com"])
        self.assertIn("confirmed", mail.outbox[0].subject)

    def test_staff_can_record_phone_booking_without_email(self):
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.post(
            "/api/admin/bookings/",
            {
                "name": "Phone Guest", "phone": "0400 999 888", "date": "2030-01-15",
                "time": "19:00", "party_size": 6, "status": "confirmed",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()["status"], "confirmed")

    def test_public_booking_still_requires_email(self):
        res = self.client.post(
            "/api/bookings/",
            {"name": "NoEmail", "date": "2030-01-15", "time": "18:00", "party_size": 2},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_staff_menu_create_and_guarded_delete(self):
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        # create a new item
        res = self.client.post(
            "/api/admin/menu/",
            {"slug": "waffle", "name": "Waffle", "description": "d", "price": "12.00", "tag": "sweet"},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        # deleting an unordered item works
        self.assertEqual(self.client.delete("/api/admin/menu/waffle/").status_code, 204)
        # deleting an item with order history is blocked with a friendly message
        self.client.credentials()
        place_order(
            self.client,
            {"customer_name": "Alex", "items": [{"slug": "berry", "quantity": 1}]},
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.delete("/api/admin/menu/berry/")
        self.assertEqual(res.status_code, 400)
        self.assertIn("unavailable", res.json()["detail"])

    def test_staff_can_approve_review_and_see_stats(self):
        review = Review.objects.create(name="A", rating=5, quote="q", is_approved=False)
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.patch(
            f"/api/admin/reviews/{review.id}/", {"is_approved": True}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Review.objects.get(pk=review.pk).is_approved)
        stats = self.client.get("/api/admin/stats/").json()
        self.assertIn("orders_today", stats)
        self.assertIn("revenue_today", stats)


class SiteContentApiTests(TestCase):
    def setUp(self):
        from django.contrib.auth.models import User

        self.client = APIClient()
        User.objects.create_user("boss", password="pw", is_staff=True)

    def auth(self):
        token = self.client.post(
            "/api/admin/login/", {"username": "boss", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_public_site_settings_and_certifications(self):
        from core.models import Certification

        Certification.objects.create(title="Shown", icon="⭐")
        Certification.objects.create(title="Hidden", icon="⭐", is_active=False)
        site = self.client.get("/api/site/").json()
        self.assertIn("George Street", site["address"])
        certs = self.client.get("/api/certifications/").json()
        self.assertEqual([c["title"] for c in certs], ["Shown"])

    def test_admin_settings_patch_requires_staff_and_flows_into_emails(self):
        from django.core import mail
        from core.models import Booking

        # anonymous PATCH rejected
        self.assertEqual(
            self.client.patch("/api/admin/site/", {"phone": "x"}, format="json").status_code, 401
        )
        self.auth()
        res = self.client.patch(
            "/api/admin/site/", {"phone": "(02) 9999 8888"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        # a booking confirmation email must now carry the NEW phone number
        booking = Booking.objects.create(
            name="A", email="a@b.co", date="2030-01-01", time="18:00", party_size=2
        )
        res = self.client.patch(
            f"/api/admin/bookings/{booking.public_id}/", {"status": "confirmed"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("(02) 9999 8888", mail.outbox[-1].body)

    def test_theme_roundtrip_and_validation(self):
        # the client's brown & yellow palette ships as the default
        self.assertEqual(self.client.get("/api/site/").json()["theme"], "maple")
        self.auth()
        res = self.client.patch("/api/admin/site/", {"theme": "berry"}, format="json")
        self.assertEqual(res.status_code, 200)
        # the public endpoint is behind a 30s shared cache now — drop it so the
        # roundtrip reads the fresh value (in production the delay is intended)
        from django.core.cache import cache

        cache.clear()
        self.assertEqual(self.client.get("/api/site/").json()["theme"], "berry")
        # unknown palettes are rejected, so the frontend can trust the value
        res = self.client.patch("/api/admin/site/", {"theme": "neon"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_remove_bg_requires_staff_and_returns_png(self):
        import os
        from io import BytesIO
        from unittest import skipUnless  # noqa: F401  (env-gated below)

        # anonymous is rejected outright
        res = self.client.post("/api/admin/remove-bg/")
        self.assertEqual(res.status_code, 401)

        if not os.environ.get("RUN_REMBG_TESTS"):
            return  # inference test is opt-in: the model is a 179 MB download

        from PIL import Image

        buf = BytesIO()
        Image.new("RGB", (64, 64), (200, 40, 40)).save(buf, format="PNG")
        buf.seek(0)
        buf.name = "dish.png"
        self.auth()
        res = self.client.post("/api/admin/remove-bg/", {"file": buf}, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.content.startswith(b"\x89PNG"))

    def test_custom_theme_colours_validated(self):
        self.auth()
        res = self.client.patch(
            "/api/admin/site/",
            {"theme": "custom", "custom_primary": "#2a9d8f", "custom_accent": "#e76f51"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        site = self.client.get("/api/site/").json()
        self.assertEqual(site["theme"], "custom")
        self.assertEqual(site["custom_primary"], "#2a9d8f")
        # malformed colours are rejected before they can reach the frontend
        res = self.client.patch("/api/admin/site/", {"custom_primary": "red"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_admin_gallery_and_certification_crud(self):
        self.auth()
        photo = self.client.post(
            "/api/admin/gallery/",
            {"album": "food", "caption": "c", "image": "/x.jpg", "alt": "a"},
            format="json",
        )
        self.assertEqual(photo.status_code, 201)
        self.assertEqual(
            self.client.delete(f"/api/admin/gallery/{photo.json()['id']}/").status_code, 204
        )
        cert = self.client.post(
            "/api/admin/certifications/", {"title": "New Award", "icon": "🏆"}, format="json"
        )
        self.assertEqual(cert.status_code, 201)


class ReviewApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_listing_is_not_throttled(self):
        # the write throttle (5/h) must not apply to reads — the home page
        # reviews carousel hits this endpoint on every load
        for _ in range(10):
            res = self.client.get("/api/reviews/")
            self.assertEqual(res.status_code, 200)

    def test_submissions_are_held_for_moderation(self):
        res = self.client.post(
            "/api/reviews/",
            {"name": "Alex", "rating": 5, "quote": "Great!"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertFalse(Review.objects.get().is_approved)
        listing = self.client.get("/api/reviews/").json()
        self.assertEqual(listing["count"], 0)


class CouponTests(TestCase):
    """The coupon path decides what a customer is charged, so every rule that
    can move a dollar has a test — including the three integrity bugs found in
    review, which are the ones most likely to come back."""

    def setUp(self):
        # DRF keeps throttle counters in the cache, which outlives a test case —
        # without this the suite throttles itself and fails by running order
        from django.core.cache import cache

        cache.clear()
        self.client = APIClient()
        make_item("berry", "17.00")
        make_item("choc", "18.00")

    def cart(self, berry=1, choc=1):
        return [{"slug": "berry", "quantity": berry}, {"slug": "choc", "quantity": choc}]

    def validate(self, code, items=None):
        return self.client.post(
            "/api/coupons/validate/",
            {"code": code, "items": items if items is not None else self.cart()},
            format="json",
        )

    # ---------- pricing ----------

    def test_percent_and_fixed_are_priced_server_side(self):
        Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        Coupon.objects.create(code="FIVE", kind="fixed", value=Decimal("5"))
        self.assertEqual(self.validate("PC20").json()["discount"], "7.00")   # 20% of 35
        self.assertEqual(self.validate("FIVE").json()["discount"], "5.00")

    def test_code_is_case_insensitive(self):
        Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        self.assertEqual(self.validate("pc20").status_code, 200)

    def test_percent_cap_limits_a_large_order(self):
        """Without max_discount a 20% code hands $40 off a $200 catering order."""
        Coupon.objects.create(
            code="CAP", kind="percent", value=Decimal("20"), max_discount=Decimal("6")
        )
        self.assertEqual(self.validate("CAP").json()["discount"], "6.00")

    def test_discount_never_exceeds_stripes_minimum_charge(self):
        """A code worth more than the cart would open a $0 Checkout Session,
        which Stripe refuses — so the code is turned away with a sentence."""
        Coupon.objects.create(code="HUGE", kind="fixed", value=Decimal("999"))
        res = self.validate("HUGE")
        self.assertEqual(res.status_code, 400)
        self.assertIn("covers your whole order", res.json()["coupon_code"])

    # ---------- the rules that turn a code away ----------

    def test_rejects_unknown_inactive_expired_early_and_exhausted(self):
        now = timezone.now()
        Coupon.objects.create(code="OFF", kind="fixed", value=Decimal("5"), is_active=False)
        Coupon.objects.create(
            code="OLD", kind="fixed", value=Decimal("5"), ends_at=now - timedelta(days=1)
        )
        Coupon.objects.create(
            code="SOON", kind="fixed", value=Decimal("5"), starts_at=now + timedelta(days=1)
        )
        Coupon.objects.create(
            code="GONE", kind="fixed", value=Decimal("5"), usage_limit=1, times_used=1
        )
        Coupon.objects.create(
            code="BIG", kind="fixed", value=Decimal("5"), min_subtotal=Decimal("100")
        )
        for code, fragment in [
            ("NOPE", "isn't valid"),
            ("OFF", "isn't valid"),
            ("OLD", "expired"),
            ("SOON", "valid yet"),
            ("GONE", "fully claimed"),
            ("BIG", "Spend $100"),
        ]:
            res = self.validate(code)
            self.assertEqual(res.status_code, 400, code)
            self.assertIn(fragment, res.json()["coupon_code"], code)

    def test_validate_prices_the_cart_itself(self):
        """The browser sends items, never a subtotal — otherwise a customer
        could claim a $500 cart and take a percentage of a number they made up."""
        Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        res = self.client.post(
            "/api/coupons/validate/",
            {"code": "PC20", "subtotal": "500.00", "items": [{"slug": "berry", "quantity": 1}]},
            format="json",
        )
        self.assertEqual(res.json()["subtotal"], "17.00")
        self.assertEqual(res.json()["discount"], "3.40")

    # ---------- redemption accounting ----------

    def test_order_snapshots_the_discount_and_reserves_a_redemption(self):
        coupon = Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        res = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "pc20", "items": self.cart()},
        )
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body["subtotal"], "35.00")
        self.assertEqual(body["discount_amount"], "7.00")
        self.assertEqual(body["total"], "28.00")
        self.assertEqual(body["coupon_code"], "PC20")
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 1)

    def test_abandoned_checkout_hands_the_redemption_back(self):
        """Reserved at placement, released when Stripe expires the session —
        otherwise a walked-away cart quietly burns a limited code."""
        coupon = Coupon.objects.create(
            code="LIMIT", kind="fixed", value=Decimal("5"), usage_limit=1
        )
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "LIMIT", "items": self.cart()},
        ).json()
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 1)

        pay_order(self.client, order["public_id"], event="checkout.session.expired")
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 0)
        self.assertEqual(
            Order.objects.get(public_id=order["public_id"]).status, "cancelled"
        )

    def test_paying_keeps_the_redemption(self):
        coupon = Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "PC20", "items": self.cart()},
        ).json()
        pay_order(self.client, order["public_id"])
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 1)

    def test_staff_cancelling_an_unpaid_order_releases_the_code(self):
        """Stripe's expiry webhook only matches orders still pending_payment,
        so a staff cancellation before then would strand the redemption."""
        from django.contrib.auth.models import User

        coupon = Coupon.objects.create(
            code="LIMIT", kind="fixed", value=Decimal("5"), usage_limit=1
        )
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "LIMIT", "items": self.cart()},
        ).json()
        obj = Order.objects.get(public_id=order["public_id"])
        obj.status = "received"  # visible to staff, still unpaid
        obj.save(update_fields=["status"])

        User.objects.create_user("chef", password="pw", is_staff=True)
        token = self.client.post(
            "/api/admin/login/", {"username": "chef", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.client.patch(
            f"/api/admin/orders/{order['public_id']}/",
            {"status": "cancelled", "cancel_reason": "sold out"},
            format="json",
        )
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 0)

    # ---------- the sales record is not editable ----------

    def test_staff_cannot_rewrite_the_money_on_an_order(self):
        from django.contrib.auth.models import User

        Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "PC20", "items": self.cart()},
        ).json()
        pay_order(self.client, order["public_id"])

        User.objects.create_user("chef", password="pw", is_staff=True)
        token = self.client.post(
            "/api/admin/login/", {"username": "chef", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.client.patch(
            f"/api/admin/orders/{order['public_id']}/",
            {"discount_amount": "999.00", "coupon_code": "HACKED", "payment_status": "refunded"},
            format="json",
        )
        obj = Order.objects.get(public_id=order["public_id"])
        self.assertEqual(obj.discount_amount, Decimal("7.00"))
        self.assertEqual(obj.coupon_code, "PC20")
        self.assertEqual(obj.payment_status, "paid")

    def test_redeemed_coupon_cannot_be_deleted_but_unused_can(self):
        """PROTECT is right — a redeemed code is part of the sales record — but
        the panel used to get a 500 instead of a sentence it could show."""
        from django.contrib.auth.models import User

        used = Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        spare = Coupon.objects.create(code="SPARE", kind="fixed", value=Decimal("2"))
        place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "PC20", "items": self.cart()},
        )
        User.objects.create_user("chef", password="pw", is_staff=True)
        token = self.client.post(
            "/api/admin/login/", {"username": "chef", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        res = self.client.delete(f"/api/admin/coupons/{used.pk}/")
        self.assertEqual(res.status_code, 400)
        self.assertIn("can't be deleted", res.json()[0])
        self.assertEqual(
            self.client.delete(f"/api/admin/coupons/{spare.pk}/").status_code, 204
        )

    def test_admin_rejects_a_percent_over_100_and_a_backwards_date_window(self):
        from django.contrib.auth.models import User

        User.objects.create_user("chef", password="pw", is_staff=True)
        token = self.client.post(
            "/api/admin/login/", {"username": "chef", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        over = self.client.post(
            "/api/admin/coupons/",
            {"code": "TOOMUCH", "kind": "percent", "value": "120"},
            format="json",
        )
        self.assertEqual(over.status_code, 400)
        now = timezone.now()
        backwards = self.client.post(
            "/api/admin/coupons/",
            {
                "code": "BACKWARDS", "kind": "fixed", "value": "5",
                "starts_at": now.isoformat(), "ends_at": (now - timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(backwards.status_code, 400)
