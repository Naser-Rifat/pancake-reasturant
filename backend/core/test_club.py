from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import ClubMember


class ClubTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.payload = {"name": "  Alex Taylor  ", "email": " Alex@Example.COM ", "phone": "0452 135 499", "privacy_consent": True}
        self.staff = get_user_model().objects.create_user(username="club-staff", is_staff=True)

    def join(self, **overrides):
        return self.client.post("/api/club/join/", {**self.payload, **overrides}, format="json")

    def member(self, **overrides):
        return ClubMember.objects.create(name="Alex", email="alex@example.com", privacy_accepted_at=timezone.now(), **overrides)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_registration_normalizes_identity_and_does_not_default_to_marketing(self):
        response = self.join()
        self.assertEqual(response.status_code, 202)
        member = ClubMember.objects.get()
        self.assertEqual(member.name, "Alex Taylor")
        self.assertEqual(member.email, "alex@example.com")
        self.assertEqual(member.phone, "0452 135 499")
        self.assertFalse(member.marketing_consent)
        self.assertIsNone(member.marketing_consented_at)
        self.assertIsNotNone(member.privacy_accepted_at)
        self.assertNotIn("email", response.data)
        self.assertNotIn("id", response.data)
        self.assertEqual(response.data["email_delivery"], "accepted")
        # Welcome email is sent for new registrations
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Welcome", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["alex@example.com"])
        self.assertEqual(mail.outbox[0].alternatives[0].mimetype, "text/html")
        self.assertIn("Welcome to the club", mail.outbox[0].alternatives[0].content)

    @patch("core.club.emails.club_welcome", return_value=False)
    def test_registration_reports_welcome_failure_without_losing_member(self, _welcome):
        response = self.join()

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data["email_delivery"], "failed")
        self.assertTrue(ClubMember.objects.filter(email="alex@example.com").exists())

    def test_explicit_marketing_consent_has_timestamp(self):
        self.assertEqual(self.join(marketing_consent=True).status_code, 202)
        member = ClubMember.objects.get()
        self.assertTrue(member.marketing_consent)
        self.assertIsNotNone(member.marketing_consented_at)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_duplicate_does_not_reactivate_or_overwrite_existing_preferences(self):
        member = self.member(status="archived")
        mail.outbox.clear()
        response = self.join(name="Someone else", marketing_consent=True)
        self.assertEqual(response.status_code, 202)
        self.assertEqual(ClubMember.objects.count(), 1)
        member.refresh_from_db()
        self.assertEqual(member.name, "Alex")
        self.assertEqual(member.status, "archived")
        self.assertFalse(member.marketing_consent)
        # A repeat submission gets an acknowledgement, but never a second welcome
        # or a preference/status mutation.
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["alex@example.com"])
        self.assertIn("membership is already active", mail.outbox[0].subject.lower())
        self.assertIn("preferences unchanged", mail.outbox[0].body.lower())
        self.assertIn("You’re already in the club", mail.outbox[0].alternatives[0].content)

    def test_case_insensitive_uniqueness_is_enforced_in_database(self):
        self.member()
        with self.assertRaises(IntegrityError), transaction.atomic():
            ClubMember.objects.create(name="Other", email="ALEX@example.com", privacy_accepted_at=timezone.now())

    def test_invalid_input_is_rejected(self):
        for override in [
            {"name": " "},
            {"name": "a"},
            {"name": "12345"},
            {"name": "###"},
            {"email": "invalid"},
            {"phone": "abc"},
            {"phone": "123"},
            {"phone": "+0123456789"},
            {"phone": "0412+345678"},
            {"privacy_consent": False},
            {"name": "x" * 101},
            {"email": "x" * 250 + "@example.com"},
        ]:
            cache.clear()
            with self.subTest(override=override):
                self.assertEqual(self.join(**override).status_code, 400)
        self.assertEqual(ClubMember.objects.count(), 0)

    def test_privacy_consent_is_required(self):
        self.assertEqual(self.client.post("/api/club/join/", {"name": "Alex", "email": "alex@example.com"}).status_code, 400)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_honeypot_returns_same_success_without_saving(self):
        self.assertEqual(self.join(website="https://spam.example").status_code, 202)
        self.assertEqual(ClubMember.objects.count(), 0)
        # No welcome email for honeypot submissions
        self.assertEqual(len(mail.outbox), 0)

    def test_phone_is_optional(self):
        payload = {**self.payload}
        del payload["phone"]
        self.assertEqual(self.client.post("/api/club/join/", payload, format="json").status_code, 202)
        member = ClubMember.objects.get()
        self.assertEqual(member.phone, "")

    def test_public_endpoint_never_lists_members(self):
        self.member()
        self.assertEqual(self.client.get("/api/club/join/").status_code, 405)

    def test_rate_limit(self):
        for _ in range(10):
            self.assertEqual(self.join().status_code, 202)
        self.assertEqual(self.join().status_code, 429)

    def test_admin_requires_staff_for_all_actions(self):
        member = self.member()
        for user in [None, get_user_model().objects.create_user(username="not-staff")]:
            self.client.force_authenticate(user=user)
            self.assertIn(self.client.get("/api/admin/club-members/").status_code, [401, 403])
            self.assertIn(self.client.patch(f"/api/admin/club-members/{member.id}/", {"status": "archived"}).status_code, [401, 403])
            self.assertIn(self.client.delete(f"/api/admin/club-members/{member.id}/").status_code, [401, 403])
            self.assertIn(self.client.post(f"/api/admin/club-members/{member.id}/revoke-consent/").status_code, [401, 403])

    def test_staff_can_search_filter_and_paginate(self):
        self.member()
        ClubMember.objects.create(name="Sam", email="sam@example.com", status="archived", privacy_accepted_at=timezone.now())
        self.client.force_authenticate(self.staff)
        response = self.client.get("/api/admin/club-members/?page_size=1")
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNotNone(response.data["next"])
        response = self.client.get("/api/admin/club-members/?search=alex&status=active")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["email"], "alex@example.com")
        self.assertEqual(self.client.get("/api/admin/club-members/?status=archived").data["count"], 1)

    def test_staff_can_archive_but_cannot_grant_consent_or_change_identity(self):
        member = self.member()
        self.client.force_authenticate(self.staff)
        response = self.client.patch(f"/api/admin/club-members/{member.id}/", {"status": "archived", "marketing_consent": True, "email": "changed@example.com", "name": "Changed"}, format="json")
        self.assertEqual(response.status_code, 200)
        member.refresh_from_db()
        self.assertEqual(member.status, "archived")
        self.assertEqual(member.email, "alex@example.com")
        self.assertFalse(member.marketing_consent)
        self.assertEqual(self.client.patch(f"/api/admin/club-members/{member.id}/", {"status": "invalid"}).status_code, 400)

    def test_staff_can_revoke_consent_then_delete(self):
        consented_at = timezone.now()
        member = self.member(marketing_consent=True, marketing_consented_at=consented_at)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.post(f"/api/admin/club-members/{member.id}/revoke-consent/").status_code, 200)
        member.refresh_from_db()
        self.assertFalse(member.marketing_consent)
        self.assertEqual(member.marketing_consented_at, consented_at)
        self.assertEqual(self.client.delete(f"/api/admin/club-members/{member.id}/").status_code, 204)
        self.assertFalse(ClubMember.objects.exists())

    def test_staff_cannot_manufacture_registration(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.post("/api/admin/club-members/", self.payload).status_code, 405)

    def test_staff_can_view_stats_and_filter_by_consent(self):
        self.member(marketing_consent=True)
        ClubMember.objects.create(name="Sam", email="sam@example.com", status="archived", marketing_consent=False, privacy_accepted_at=timezone.now())
        self.client.force_authenticate(self.staff)
        stats = self.client.get("/api/admin/club-members/stats/")
        self.assertEqual(stats.status_code, 200)
        self.assertEqual(stats.data, {"total": 2, "active": 1, "archived": 1, "consented": 1})
        self.assertEqual(self.client.get("/api/admin/club-members/?consent=true").data["count"], 1)
        self.assertEqual(self.client.get("/api/admin/club-members/?consent=false").data["count"], 1)
