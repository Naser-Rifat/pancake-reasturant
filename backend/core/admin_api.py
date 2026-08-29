"""Staff-only API consumed by the custom Next.js admin panel (/admin)."""
# pyrefly: ignore [missing-import]
from django.contrib.auth import authenticate
# pyrefly: ignore [missing-import]
from django.db.models import F, Sum
# pyrefly: ignore [missing-import]
from django.db.models.deletion import ProtectedError
# pyrefly: ignore [missing-import]
from django.http import HttpResponse
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import mixins, serializers, viewsets
# pyrefly: ignore [missing-import]
from rest_framework.authtoken.models import Token
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAdminUser
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.throttling import ScopedRateThrottle
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView

from . import emails
# pyrefly: ignore [missing-import]
from .models import (
    Announcement,
    Booking,
    Certification,
    GalleryPhoto,
    MenuItem,
    OpeningHours,
    Order,
    OrderItem,
    Review,
    SiteSettings,
)
from .serializers import OrderSerializer, SiteSettingsSerializer


# ---------- auth ----------

class AdminLoginView(APIView):
    """Exchange staff credentials for an API token."""

    authentication_classes = []  # login itself is unauthenticated
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]  # brute-force protection
    throttle_scope = "logins"

    def post(self, request):
        user = authenticate(
            username=request.data.get("username", ""),
            password=request.data.get("password", ""),
        )
        if user is None or not user.is_staff:
            return Response({"detail": "Invalid credentials for a staff account."}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


# ---------- serializers ----------

class AdminOrderSerializer(OrderSerializer):
    class Meta(OrderSerializer.Meta):
        # status and cancel_reason become writable for staff
        read_only_fields = ["public_id", "created_at"]


class AdminBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "public_id", "name", "email", "phone", "date", "time",
            "party_size", "notes", "status", "created_at",
        ]
        read_only_fields = ["public_id", "created_at"]


class AdminReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "suburb", "rating", "quote", "avatar", "is_approved", "created_at"]
        read_only_fields = ["id", "created_at"]


class AdminMenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            "slug", "name", "description", "price", "tag", "heat", "kcal",
            "protein_g", "prep_time", "image", "photo", "is_featured",
            "is_available", "sort_order",
        ]


# ---------- viewsets ----------

class AdminOrderViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    lookup_field = "public_id"

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items__menu_item").order_by("-created_at")
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return qs

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        order = serializer.save()
        if order.status != old_status:
            emails.order_status_changed(order)


class AdminBookingViewSet(
    mixins.CreateModelMixin,  # staff record phone bookings
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdminUser]
    serializer_class = AdminBookingSerializer
    lookup_field = "public_id"

    def get_queryset(self):
        qs = Booking.objects.order_by("-created_at")
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        # phone bookings are created already confirmed — the guest still
        # deserves their confirmation email
        booking = serializer.save()
        emails.booking_status_changed(booking)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        booking = serializer.save()
        if booking.status != old_status:
            emails.booking_status_changed(booking)


class AdminReviewViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAdminUser]
    serializer_class = AdminReviewSerializer
    queryset = Review.objects.order_by("is_approved", "-created_at")
    pagination_class = None


class AdminMenuItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminMenuItemSerializer
    queryset = MenuItem.objects.all()
    lookup_field = "slug"
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This item appears in past orders, so it can't be deleted. "
                           "Mark it unavailable instead."},
                status=400,
            )


# ---------- background removal (auto-cutout for uploads) ----------

_REMBG_SESSION = None  # model loads once per process, on first use


class AdminRemoveBgView(APIView):
    """Strip the background from an uploaded dish photo so any picture the
    client provides becomes a transparent cutout that fits the card design."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"detail": "Attach an image as 'file'."}, status=400)
        if upload.size > 12 * 1024 * 1024:
            return Response({"detail": "Image too large (max 12 MB)."}, status=400)

        from io import BytesIO

        # pyrefly: ignore [missing-import]
        from PIL import Image
        # pyrefly: ignore [missing-import]
        from rembg import new_session, remove

        try:
            img = Image.open(upload).convert("RGBA")
        except Exception:
            return Response({"detail": "That file doesn't look like an image."}, status=400)

        img.thumbnail((1600, 1600))  # cap inference cost; plenty for the cards
        global _REMBG_SESSION
        if _REMBG_SESSION is None:
            _REMBG_SESSION = new_session("isnet-general-use")
        cut = remove(img, session=_REMBG_SESSION)
        alpha = cut.split()[3].point(lambda v: 255 if v > 12 else 0)
        bbox = alpha.getbbox()
        if bbox:
            cut = cut.crop(bbox)

        buf = BytesIO()
        cut.save(buf, format="PNG", optimize=True)
        return HttpResponse(buf.getvalue(), content_type="image/png")


# ---------- site content & settings ----------

class AdminCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "icon", "title", "subtitle", "sort_order", "is_active"]


class AdminGalleryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryPhoto
        fields = ["id", "album", "caption", "image", "alt", "sort_order"]


class AdminAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "message", "link_text", "link_url", "image", "is_active"]


class AdminOpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ["id", "label", "opens", "closes", "sort_order"]


class AdminCertificationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCertificationSerializer
    queryset = Certification.objects.all()
    pagination_class = None


class AdminGalleryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminGalleryPhotoSerializer
    queryset = GalleryPhoto.objects.all()
    pagination_class = None


class AdminAnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminAnnouncementSerializer
    queryset = Announcement.objects.all()
    pagination_class = None


class AdminOpeningHoursViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOpeningHoursSerializer
    queryset = OpeningHours.objects.all()
    pagination_class = None


class AdminSiteSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.load()).data)

    def patch(self, request):
        serializer = SiteSettingsSerializer(SiteSettings.load(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ---------- dashboard stats ----------

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        today_orders = Order.objects.filter(created_at__date=today).exclude(status="cancelled")
        revenue = (
            OrderItem.objects.filter(order__in=today_orders)
            .aggregate(total=Sum(F("unit_price") * F("quantity")))["total"]
            or 0
        )
        return Response({
            "orders_today": today_orders.count(),
            "revenue_today": str(revenue),
            "active_orders": Order.objects.filter(status__in=["received", "preparing", "ready"]).count(),
            "pending_bookings": Booking.objects.filter(status="pending").count(),
            "pending_reviews": Review.objects.filter(is_approved=False).count(),
        })
