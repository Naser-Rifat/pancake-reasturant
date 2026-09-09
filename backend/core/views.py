from decimal import Decimal

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import mixins, status as http_status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from . import payments

from .models import (
    Announcement,
    Booking,
    Certification,
    HomeStep,
    GalleryPhoto,
    MenuItem,
    OpeningHours,
    Order,
    Review,
    SiteSettings,
)
from .serializers import (
    price_with_coupon,
    AnnouncementSerializer,
    BookingSerializer,
    CertificationSerializer,
    HomeStepSerializer,
    GalleryPhotoSerializer,
    MenuItemSerializer,
    OpeningHoursSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ReviewSerializer,
    SiteSettingsSerializer,
)


class BurstScopedRateThrottle(ScopedRateThrottle):
    """A second scoped throttle that reads `burst_throttle_scope` off the view,
    so one endpoint can pair a per-minute flood stop with its hourly rate."""

    scope_attr = "burst_throttle_scope"


class ThrottleWritesOnlyMixin:
    """Rate-limit only `create` — status polling and public listings must stay unthrottled."""

    def get_throttles(self):
        if getattr(self, "action", None) == "create":
            return super().get_throttles()
        return []


# the public menu is the busiest read — a 30s shared cache absorbs spikes
@method_decorator(cache_page(30), name="list")
@method_decorator(cache_page(30), name="retrieve")
class MenuItemViewSet(viewsets.ReadOnlyModelViewSet):
    """Public menu. `?featured=1` returns the home-page picks, `?tag=sweet` filters."""

    serializer_class = MenuItemSerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        qs = MenuItem.objects.filter(is_available=True)
        if self.request.query_params.get("featured") in ("1", "true"):
            qs = qs.filter(is_featured=True)
        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tag=tag)
        return qs


class BookingViewSet(
    ThrottleWritesOnlyMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Create a table booking; retrieve by public id to check its status."""

    serializer_class = BookingSerializer
    lookup_field = "public_id"
    throttle_scope = "bookings"
    queryset = Booking.objects.all()

    def perform_create(self, serializer):
        from . import emails

        booking = serializer.save()
        emails.staff_new_booking(booking)  # the guest is emailed on confirm/decline


class OrderViewSet(
    ThrottleWritesOnlyMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Place a pickup order from the cart; retrieve by public id for status."""

    lookup_field = "public_id"
    # per-IP: 15/min stops a spam flood; 200/hour never blocks a dine-in rush
    # where the whole venue shares one wifi IP
    throttle_classes = [ScopedRateThrottle, BurstScopedRateThrottle]
    throttle_scope = "orders"
    burst_throttle_scope = "orders_burst"

    def get_queryset(self):
        return Order.objects.prefetch_related("items__menu_item")

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == "create" else OrderSerializer

    def create(self, request, *args, **kwargs):
        """Create the order unpaid, hand back a Stripe Checkout URL.

        No emails here — the kitchen only hears about the order when the
        Stripe webhook confirms payment (see payments._mark_paid).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(status=Order.Status.PENDING_PAYMENT)
        try:
            checkout_url = payments.create_checkout_session(order)
        except payments.PaymentError:
            order.delete()  # never leave a dangling order the customer can't pay for
            raise ValidationError(
                "Payments are unavailable right now — please try again in a minute or call us."
            )
        data = OrderSerializer(order).data
        data["checkout_url"] = checkout_url
        return Response(data, status=http_status.HTTP_201_CREATED)


class CouponValidateView(APIView):
    """Price a coupon against a cart so the drawer can show the discount.

    Throttled hard: a coupon code is a short guessable string, and without a
    limit this endpoint is a free oracle for finding live codes.

    The cart's line items come in, never a subtotal — the customer's browser
    does not get to say what the order is worth, here or at checkout. This
    returns the same number `apply_coupon` will charge, because both call
    `price_with_coupon`.
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "coupons"

    def post(self, request):
        code = (request.data.get("code") or "").strip()
        if not code:
            raise ValidationError({"coupon_code": "Enter a code."})

        items = request.data.get("items") or []
        if not isinstance(items, list) or not items:
            raise ValidationError({"items": "Your order is empty."})

        wanted = {}
        for entry in items:
            try:
                slug = str(entry["slug"])
                qty = int(entry["quantity"])
            except (TypeError, KeyError, ValueError):
                raise ValidationError({"items": "Malformed cart."})
            if qty < 1:
                continue
            wanted[slug] = wanted.get(slug, 0) + qty

        priced = MenuItem.objects.filter(slug__in=wanted, is_available=True)
        subtotal = sum((m.price * wanted[m.slug] for m in priced), start=Decimal("0"))
        if subtotal <= 0:
            raise ValidationError({"items": "Your order is empty."})

        coupon, discount = price_with_coupon(code, subtotal)
        return Response(
            {
                "code": coupon.code,
                "label": coupon.discount_label,
                "subtotal": f"{subtotal:.2f}",
                "discount": f"{discount:.2f}",
                "total": f"{subtotal - discount:.2f}",
            }
        )

@method_decorator(cache_page(30), name="list")
class ReviewViewSet(
    ThrottleWritesOnlyMixin, mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    """List approved reviews; submissions are held for moderation."""

    serializer_class = ReviewSerializer
    throttle_scope = "reviews"

    def get_queryset(self):
        return Review.objects.filter(is_approved=True)

    def perform_create(self, serializer):
        serializer.save(is_approved=False)


class GalleryPhotoListView(ListAPIView):
    """Gallery photos. `?album=food|interior|events` filters."""

    serializer_class = GalleryPhotoSerializer
    pagination_class = None

    def get_queryset(self):
        qs = GalleryPhoto.objects.all()
        album = self.request.query_params.get("album")
        if album:
            qs = qs.filter(album=album)
        return qs


class AnnouncementView(APIView):
    """The currently active announcement bar message, or 204 if none."""

    def get(self, request):
        announcement = Announcement.current()
        if announcement is None:
            return Response(status=204)
        return Response(AnnouncementSerializer(announcement).data)


class OpeningHoursListView(ListAPIView):
    serializer_class = OpeningHoursSerializer
    queryset = OpeningHours.objects.all()
    pagination_class = None


class CampaignListView(ListAPIView):
    """The live slider campaigns — the home page runs them after the menu."""

    serializer_class = AnnouncementSerializer
    pagination_class = None

    def get_queryset(self):
        return Announcement.live().filter(placement="slider")


class HomeStepListView(ListAPIView):
    serializer_class = HomeStepSerializer
    queryset = HomeStep.objects.all()
    pagination_class = None


class CertificationListView(ListAPIView):
    serializer_class = CertificationSerializer
    queryset = Certification.objects.filter(is_active=True)
    pagination_class = None


class SiteSettingsView(APIView):
    """Public content blocks + business details (address, phone, socials…)."""

    def get(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.load()).data)
