from rest_framework import mixins, viewsets
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

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


class ThrottleWritesOnlyMixin:
    """Rate-limit only `create` — status polling and public listings must stay unthrottled."""

    def get_throttles(self):
        if getattr(self, "action", None) == "create":
            return super().get_throttles()
        return []


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


class OrderViewSet(
    ThrottleWritesOnlyMixin, mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Place a pickup order from the cart; retrieve by public id for status."""

    lookup_field = "public_id"
    throttle_scope = "orders"

    def get_queryset(self):
        return Order.objects.prefetch_related("items__menu_item")

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == "create" else OrderSerializer

    def perform_create(self, serializer):
        from . import emails

        order = serializer.save()
        emails.order_status_changed(order)  # "we've got your order" confirmation


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
    """All live campaigns — the home page runs them as a slider."""

    serializer_class = AnnouncementSerializer
    pagination_class = None

    def get_queryset(self):
        return Announcement.live()


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
