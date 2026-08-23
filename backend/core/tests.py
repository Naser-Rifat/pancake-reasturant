from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Booking, MenuItem, Review


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
        res = self.client.post(
            "/api/orders/",
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
        self.assertEqual(body["status"], "received")
        # order is retrievable by public id
        res2 = self.client.get(f"/api/orders/{body['public_id']}/")
        self.assertEqual(res2.status_code, 200)

    def test_order_placement_sends_confirmation_with_abn(self):
        from django.core import mail

        res = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("got your order", mail.outbox[0].subject)
        self.assertIn("ABN", mail.outbox[0].body)
        self.assertIn("incl. GST", mail.outbox[0].body)

    def test_cancel_with_reason_emails_customer(self):
        from django.contrib.auth.models import User
        from django.core import mail

        order = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        ).json()
        mail.outbox.clear()
        User.objects.create_user("chef", password="pw", is_staff=True)
        token = self.client.post(
            "/api/admin/login/", {"username": "chef", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.patch(
            f"/api/admin/orders/{order['public_id']}/",
            {"status": "cancelled", "cancel_reason": "Out of blueberries tonight"},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Out of blueberries tonight", mail.outbox[0].body)

    def test_rejects_oversized_orders(self):
        res = self.client.post(
            "/api/orders/",
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
        res = self.client.post(
            "/api/orders/",
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
        res = self.client.post(
            "/api/orders/",
            {"customer_name": "Alex", "items": [{"slug": "nope", "quantity": 1}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        res = self.client.post(
            "/api/orders/", {"customer_name": "Alex", "items": []}, format="json"
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
        order = self.client.post(
            "/api/orders/",
            {"customer_name": "Alex", "items": [{"slug": "berry", "quantity": 1}]},
            format="json",
        ).json()
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

        order = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        ).json()
        mail.outbox.clear()  # drop the placement-confirmation email
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
        self.client.post(
            "/api/orders/",
            {"customer_name": "Alex", "items": [{"slug": "berry", "quantity": 1}]},
            format="json",
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
