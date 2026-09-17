import hashlib
import hmac
import json
import os
import time
from datetime import time as datetime_time, timedelta
from decimal import Decimal
from io import BytesIO
from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.core.mail import send_mail as django_send_mail
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from .emails import _send, send_test
from .models import (
    Announcement,
    Booking,
    Category,
    Certification,
    Coupon,
    GalleryPhoto,
    HomeStep,
    MenuItem,
    OpeningHours,
    Order,
    Review,
)

# Orders currently use the pay-at-counter flow. Stripe helpers remain below so
# webhook/refund behaviour can still be covered without touching the network.

WEBHOOK_SECRET = "whsec_test_suite"


def place_order(client, payload, format="json"):
    """POST a valid pickup order, supplying the required customer contacts."""
    payload = {"phone": "0412 345 678", "email": "alex@example.com", **payload}
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


class EmailDeliveryTests(TestCase):
    @override_settings(
        EMAIL_BACKEND="anymail.backends.brevo.EmailBackend",
        ANYMAIL={"BREVO_API_KEY": "test-api-key", "REQUESTS_TIMEOUT": 7},
        DEFAULT_FROM_EMAIL="The Pancake Club <hello@thepancakeclub.com.au>",
    )
    @patch("requests.Session.request")
    def test_brevo_backend_builds_the_expected_https_request(self, request_mock):
        response = Mock(status_code=201, content=b'{"messageId":"test-message"}')
        response.json.return_value = {"messageId": "test-message"}
        request_mock.return_value = response

        sent = django_send_mail(
            "Order received",
            "Your order is in the kitchen.",
            None,
            ["customer@example.com"],
            fail_silently=False,
        )

        self.assertEqual(sent, 1)
        request = request_mock.call_args.kwargs
        self.assertEqual(request["method"], "POST")
        self.assertEqual(request["url"], "https://api.brevo.com/v3/smtp/email")
        self.assertEqual(request["headers"]["api-key"], "test-api-key")
        self.assertEqual(request["timeout"], 7)
        payload = json.loads(request["data"])
        self.assertEqual(payload["to"], [{"email": "customer@example.com"}])
        self.assertEqual(payload["subject"], "Order received")

    @override_settings(EMAIL_BACKEND="anymail.backends.brevo.EmailBackend")
    @patch("core.emails.send_mail", return_value=1)
    def test_test_email_reports_brevo_api_acceptance(self, send_mail_mock):

        ok, detail = send_test("customer@example.com")
        self.assertTrue(ok)
        self.assertIn("Accepted by Brevo API", detail)
        send_mail_mock.assert_called_once()

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend")
    @patch("core.emails.send_mail", return_value=1)
    def test_console_backend_never_claims_real_delivery(self, _send_mail_mock):
        ok, detail = send_test("customer@example.com")
        self.assertFalse(ok)
        self.assertIn("console only", detail)

    @patch("core.emails.send_mail", side_effect=TimeoutError("timed out"))
    def test_test_email_surfaces_provider_failure(self, _send_mail_mock):
        ok, detail = send_test("customer@example.com")
        self.assertFalse(ok)
        self.assertEqual(detail, "Send failed: timed out")

    @override_settings(EMAIL_SEND_ATTEMPTS=2)
    @patch("core.emails.send_mail")
    def test_transactional_email_retries_a_definitive_provider_5xx(self, send_mail_mock):
        provider_error = RuntimeError("provider unavailable")
        provider_error.response = Mock(status_code=503)
        send_mail_mock.side_effect = [provider_error, 1]

        self.assertTrue(_send("customer@example.com", "Order received", "Saved"))
        self.assertEqual(send_mail_mock.call_count, 2)

    @override_settings(EMAIL_SEND_ATTEMPTS=2)
    @patch("core.emails.send_mail", side_effect=TimeoutError("timed out"))
    def test_transactional_email_does_not_retry_an_ambiguous_timeout(self, send_mail_mock):
        self.assertFalse(_send("customer@example.com", "Order received", "Saved"))
        send_mail_mock.assert_called_once()


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
        # pay-at-counter: the kitchen receives the order immediately
        self.assertEqual(body["status"], "received")
        self.assertEqual(body["payment_status"], "unpaid")
        self.assertEqual(body["email_delivery"], "accepted")
        self.assertTrue(body["checkout_url"])
        # order is retrievable by public id
        res2 = self.client.get(f"/api/orders/{body['public_id']}/")
        self.assertEqual(res2.status_code, 200)

    @patch("core.views.emails.staff_new_order", return_value=True)
    @patch("core.views.emails.order_status_changed", return_value=False)
    def test_create_order_reports_confirmation_failure_without_losing_order(
        self, _customer_email, _staff_email
    ):
        response = place_order(
            self.client,
            {
                "customer_name": "Alex",
                "items": [{"slug": "berry", "quantity": 1}],
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email_delivery"], "failed")
        self.assertTrue(Order.objects.filter(public_id=response.json()["public_id"]).exists())

    def test_order_requires_a_contact_phone(self):
        res = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Alex",
                "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("phone", res.json())

    def test_order_requires_a_valid_email(self):
        missing = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Alex",
                "phone": "0412 345 678",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(missing.status_code, 400)
        self.assertIn("email", missing.json())

        invalid = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Alex",
                "email": "not-an-email",
                "phone": "0412 345 678",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("email", invalid.json())

    def test_order_placement_sends_confirmation_with_abn(self):
        res = place_order(
            self.client,
            {
                "customer_name": "Alex", "email": "alex@example.com",
                "items": [{"slug": "berry", "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        # one confirmation to the customer and one heads-up to staff are sent
        # immediately in the pay-at-counter flow
        self.assertEqual(len(mail.outbox), 2)
        customer_mail = next(m for m in mail.outbox if "alex@example.com" in m.to)
        self.assertIn("got your order", customer_mail.subject)
        self.assertIn("ABN", customer_mail.body)
        self.assertIn("incl. GST", customer_mail.body)
        staff_mail = next(m for m in mail.outbox if "alex@example.com" not in m.to)
        self.assertIn("New pickup order", staff_mail.subject)

    def test_cancel_with_reason_emails_customer(self):
        order = place_order(
            self.client,
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
        # an unpaid pay-at-counter order must not attempt a Stripe refund
        with patch("core.payments.refund_order") as refund:
            res = self.client.patch(
                f"/api/admin/orders/{order['public_id']}/",
                {"status": "cancelled", "cancel_reason": "Out of blueberries tonight"},
                format="json",
            )
        self.assertEqual(res.status_code, 200, res.content)
        refund.assert_not_called()
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
        self.assertEqual(res.json()["email_delivery"], "accepted")
        public_id = res.json()["public_id"]
        detail = self.client.get(f"/api/bookings/{public_id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertNotIn("name", detail.json())
        self.assertNotIn("email", detail.json())
        self.assertNotIn("phone", detail.json())
        self.assertNotIn("notes", detail.json())
        self.assertEqual(len(mail.outbox), 2)
        customer_mail = next(message for message in mail.outbox if message.to == ["a@b.co"])
        self.assertIn("received your booking request", customer_mail.subject.lower())
        self.assertIn("not confirmed", customer_mail.body.lower())

    @patch("core.views.emails.staff_new_booking", return_value=True)
    @patch("core.views.emails.booking_request_received", return_value=False)
    def test_create_booking_reports_confirmation_failure_without_losing_booking(
        self, _customer_email, _staff_email
    ):
        tomorrow = timezone.localdate() + timedelta(days=1)
        response = self.client.post(
            "/api/bookings/",
            {
                "name": "Alex",
                "email": "a@b.co",
                "date": str(tomorrow),
                "time": "18:00",
                "party_size": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email_delivery"], "failed")
        self.assertTrue(Booking.objects.filter(public_id=response.json()["public_id"]).exists())


class AdminApiTests(TestCase):
    def setUp(self):

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

    def test_logout_revokes_staff_token(self):
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.post("/api/admin/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/admin/stats/").status_code, 401)

    @patch("core.admin_api.emails.send_test", return_value=(True, "Accepted by Brevo API"))
    def test_staff_can_send_test_email_to_an_explicit_valid_address(self, send_test_mock):
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.post(
            "/api/admin/test-email/", {"to": "owner@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(response.json()["to"], "owner@example.com")
        send_test_mock.assert_called_once_with("owner@example.com")

    def test_test_email_rejects_an_invalid_recipient(self):
        token = self.login("boss").json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.post(
            "/api/admin/test-email/", {"to": "not-an-email"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_login_is_throttled_against_brute_force(self):

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

        self.client = APIClient()
        User.objects.create_user("boss", password="pw", is_staff=True)

    def auth(self):
        token = self.client.post(
            "/api/admin/login/", {"username": "boss", "password": "pw"}, format="json"
        ).json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_public_site_settings_and_certifications(self):

        Certification.objects.create(title="Shown", icon="⭐")
        Certification.objects.create(title="Hidden", icon="⭐", is_active=False)
        site = self.client.get("/api/site/").json()
        self.assertIn("George Street", site["address"])
        certs = self.client.get("/api/certifications/").json()
        self.assertEqual([c["title"] for c in certs], ["Shown"])

    def test_public_content_endpoints_filter_and_order_live_content(self):


        GalleryPhoto.objects.create(
            album="food", caption="Stack", image="/stack.jpg", alt="Pancake stack", sort_order=2
        )
        GalleryPhoto.objects.create(
            album="interior", caption="Room", image="/room.jpg", alt="Dining room", sort_order=1
        )
        OpeningHours.objects.create(
            label="Monday", opens=datetime_time(8, 0), closes=datetime_time(17, 0), sort_order=1
        )
        HomeStep.objects.create(
            label="Step 1", title="Choose", text="Pick a stack", image="/step.jpg", sort_order=1
        )
        Announcement.objects.create(message="Top deal", placement="band", is_active=True)
        Announcement.objects.create(message="Slider deal", placement="slider", is_active=True)
        Announcement.objects.create(message="Hidden deal", placement="slider", is_active=False)

        gallery = self.client.get("/api/gallery/?album=food")
        self.assertEqual(gallery.status_code, 200)
        self.assertEqual([photo["caption"] for photo in gallery.json()], ["Stack"])

        hours = self.client.get("/api/hours/")
        self.assertEqual(hours.status_code, 200)
        self.assertEqual(hours.json()[0]["label"], "Monday")

        steps = self.client.get("/api/home-steps/")
        self.assertEqual(steps.status_code, 200)
        self.assertIn("Choose", [step["title"] for step in steps.json()])

        announcement = self.client.get("/api/announcement/")
        self.assertEqual(announcement.status_code, 200)
        self.assertEqual(announcement.json()["message"], "Top deal")

        campaigns = self.client.get("/api/campaigns/")
        self.assertEqual(campaigns.status_code, 200)
        self.assertEqual([campaign["message"] for campaign in campaigns.json()], ["Slider deal"])

    def test_admin_settings_patch_requires_staff_and_flows_into_emails(self):


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

        cache.clear()
        self.assertEqual(self.client.get("/api/site/").json()["theme"], "berry")
        # unknown palettes are rejected, so the frontend can trust the value
        res = self.client.patch("/api/admin/site/", {"theme": "neon"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_remove_bg_requires_staff_and_returns_png(self):
        # noqa: F401  (env-gated below)

        # anonymous is rejected outright
        res = self.client.post("/api/admin/remove-bg/")
        self.assertEqual(res.status_code, 401)

        if not os.environ.get("RUN_REMBG_TESTS"):
            return  # inference test is opt-in: the model is a 179 MB download


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

    def test_stripe_expiry_does_not_cancel_a_pay_at_counter_order(self):
        """A stale Stripe event must not alter the active direct-order flow."""
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
        self.assertEqual(coupon.times_used, 1)
        self.assertEqual(
            Order.objects.get(public_id=order["public_id"]).status, "received"
        )

    def test_stale_stripe_completion_keeps_the_redemption(self):
        coupon = Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "PC20", "items": self.cart()},
        ).json()
        pay_order(self.client, order["public_id"])
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 1)

    def test_staff_cancelling_an_unpaid_order_releases_the_code(self):
        """Cancelling a direct unpaid order releases its reserved coupon."""

        coupon = Coupon.objects.create(
            code="LIMIT", kind="fixed", value=Decimal("5"), usage_limit=1
        )
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "LIMIT", "items": self.cart()},
        ).json()
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

        Coupon.objects.create(code="PC20", kind="percent", value=Decimal("20"))
        order = place_order(
            self.client,
            {"customer_name": "Alex", "coupon_code": "PC20", "items": self.cart()},
        ).json()
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
        self.assertEqual(obj.payment_status, "unpaid")

    def test_redeemed_coupon_cannot_be_deleted_but_unused_can(self):
        """PROTECT is right — a redeemed code is part of the sales record — but
        the panel used to get a 500 instead of a sentence it could show."""

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


class CategoryTests(TestCase):
    def setUp(self):


        self.client = APIClient()
        self.staff_user = User.objects.create_user("staff", password="password123", is_staff=True)
        login_res = self.client.post(
            "/api/admin/login/", {"username": "staff", "password": "password123"}, format="json"
        )
        self.token = login_res.json()["token"]

    def test_public_categories_list_and_dish_count(self):

        cat = Category.objects.create(name="Beverages", slug="beverages", icon="☕", sort_order=10)
        MenuItem.objects.create(
            name="Iced Latte",
            slug="iced-latte",
            description="Cold and bold",
            price="6.50",
            category=cat,
            is_available=True,
        )

        res = self.client.get("/api/categories/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        bev = next((c for c in data if c["slug"] == "beverages"), None)
        self.assertIsNotNone(bev)
        self.assertEqual(bev["dish_count"], 1)
        self.assertEqual(bev["icon"], "☕")

    def test_admin_category_crud_and_delete_protection(self):

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

        # 1. Create category
        create_res = self.client.post(
            "/api/admin/categories/",
            {"name": "Sides & Bites", "slug": "sides", "icon": "🍟", "sort_order": 5},
            format="json",
        )
        self.assertEqual(create_res.status_code, 201)
        cat_id = create_res.json()["id"]

        # 2. Update category
        update_res = self.client.patch(
            f"/api/admin/categories/{cat_id}/",
            {"name": "Sides & Extra Bites"},
            format="json",
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["name"], "Sides & Extra Bites")

        # 3. Assign a dish to it
        item = MenuItem.objects.create(
            name="Crispy Fries",
            slug="crispy-fries",
            description="Golden fries",
            price="8.00",
            category_id=cat_id,
        )

        # 4. Attempt to delete -> Should be rejected because dish is attached
        del_fail = self.client.delete(f"/api/admin/categories/{cat_id}/")
        self.assertEqual(del_fail.status_code, 400)
        self.assertIn("dish(es) are assigned", del_fail.json()["detail"])

        # 5. Remove dish attachment and delete
        item.category = None
        item.save()

        del_ok = self.client.delete(f"/api/admin/categories/{cat_id}/")
        self.assertEqual(del_ok.status_code, 204)
        self.assertFalse(Category.objects.filter(pk=cat_id).exists())
