"""Activates the restaurant's configured timezone for every request, so
booking validation and "today's orders" stats follow the venue's local
(daylight-saving aware) clock even if the server runs in UTC."""
from zoneinfo import ZoneInfo

from django.core.cache import cache
from django.utils import timezone


class RestaurantTimezoneMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tz_name = cache.get("site-timezone")
        if tz_name is None:
            from .models import SiteSettings

            try:
                tz_name = SiteSettings.load().timezone
            except Exception:  # e.g. during migrate, before the table exists
                tz_name = ""
            cache.set("site-timezone", tz_name, 60)
        try:
            timezone.activate(ZoneInfo(tz_name))
        except Exception:
            timezone.deactivate()  # fall back to settings.TIME_ZONE
        return self.get_response(request)
