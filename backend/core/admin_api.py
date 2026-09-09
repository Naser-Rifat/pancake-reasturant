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

from . import emails, payments
# pyrefly: ignore [missing-import]
from .models import (
    Announcement,
    Booking,
    Certification,
    Coupon,
    HomeStep,
    GalleryPhoto,
    MenuItem,
    MenuItemPhoto,
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
        # staff also see contact details the public serializer withholds
        fields = OrderSerializer.Meta.fields + ["email", "phone", "notes"]
        # Staff move an order through the kitchen and write a cancellation
        # reason. Everything else is the sales record: the money must only ever
        # be set by the checkout that charged it and by Stripe's webhook — a
        # PATCH could otherwise rewrite what a customer was charged, or mark an
        # unpaid order paid.
        read_only_fields = [
            "public_id", "created_at", "payment_status",
            "items", "subtotal", "coupon_code", "discount_amount", "total",
        ]


class AdminBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "public_id", "name", "email", "phone", "date", "time",
            "party_size", "preselected_dish", "notes", "status", "created_at",
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

# Newest rows the admin list endpoints return. Full history stays in the DB
# (tax record keeping) — this only bounds what the polling UI downloads.
LIST_CAP = 300


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
        else:
            # unpaid checkouts aren't the kitchen's business until Stripe confirms
            qs = qs.exclude(status=Order.Status.PENDING_PAYMENT)
        if self.action == "list":
            qs = qs[:LIST_CAP]  # keep the 15s poll cheap as history grows
        return qs

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        order = serializer.save()
        if order.status == old_status:
            return
        refund_error = None
        if order.status == Order.Status.CANCELLED:
            # An unpaid order cancelled here never reaches Stripe's expiry
            # webhook (that only matches orders still pending_payment), so the
            # redemption it reserved would stay claimed forever.
            if order.payment_status != Order.PaymentStatus.PAID:
                payments.release_coupon(order)
            try:
                payments.refund_order(order)  # no-op unless the order was paid
            except Exception as exc:
                refund_error = exc
        emails.order_status_changed(order)
        if refund_error is not None:
            # order stays cancelled and the customer was emailed; staff must
            # know the money didn't move so they can refund from the dashboard
            raise serializers.ValidationError(
                f"Order cancelled but the Stripe refund failed: {refund_error}. "
                "Please refund manually in the Stripe dashboard."
            ) from refund_error


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
        if self.action == "list":
            qs = qs[:LIST_CAP]
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


class AdminMenuItemPhotoSerializer(serializers.ModelSerializer):
    # the admin panel speaks in slugs, not database ids
    menu_item = serializers.SlugRelatedField(slug_field="slug", queryset=MenuItem.objects.all())

    class Meta:
        model = MenuItemPhoto
        fields = ["id", "menu_item", "image", "alt", "sort_order"]


class AdminMenuItemPhotoViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAdminUser]
    serializer_class = AdminMenuItemPhotoSerializer
    pagination_class = None

    def get_queryset(self):
        qs = MenuItemPhoto.objects.all()
        slug = self.request.query_params.get("menu_item")
        if slug:
            qs = qs.filter(menu_item__slug=slug)
        return qs


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
        fields = ["id", "icon", "image", "title", "subtitle", "sort_order", "is_active"]


class AdminGalleryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryPhoto
        fields = ["id", "album", "caption", "image", "alt", "sort_order", "focus"]


class AdminAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = [
            "id", "message", "details", "link_text", "link_url", "image",
            "starts_at", "ends_at", "is_active", "placement",
            "card1_dish", "card2_dish",
        ]


class AdminOpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ["id", "label", "opens", "closes", "sort_order"]


class AdminCouponSerializer(serializers.ModelSerializer):
    # read-only mirrors of the model's rules, so the panel can show "12 / 100"
    # and a live/expired chip without re-implementing the logic in TypeScript
    discount_label = serializers.CharField(read_only=True)
    is_exhausted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "kind", "value", "max_discount", "min_subtotal",
            "starts_at", "ends_at", "usage_limit", "times_used", "is_active",
            "description", "discount_label", "is_exhausted", "created_at",
        ]
        # times_used is a ledger, not a setting — only redemptions move it
        read_only_fields = ["id", "times_used", "created_at"]

    def validate_code(self, value):
        code = value.strip().upper()
        if not code:
            raise serializers.ValidationError("Give the code a name customers can type.")
        clash = Coupon.objects.filter(code=code)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("A coupon with that code already exists.")
        return code

    def validate(self, attrs):
        kind = attrs.get("kind", getattr(self.instance, "kind", Coupon.Kind.PERCENT))
        value = attrs.get("value", getattr(self.instance, "value", None))
        if kind == Coupon.Kind.PERCENT and value is not None and value > 100:
            raise serializers.ValidationError({"value": "A percent coupon cannot exceed 100%."})
        starts, ends = attrs.get("starts_at"), attrs.get("ends_at")
        if starts and ends and ends <= starts:
            raise serializers.ValidationError({"ends_at": "The end date must be after the start."})
        return attrs


class AdminCouponViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCouponSerializer
    queryset = Coupon.objects.all()
    pagination_class = None

    def perform_destroy(self, instance):
        """A redeemed coupon is part of the sales record — PROTECT stops the
        delete, and without this the panel got a 500 instead of a sentence."""
        used = instance.orders.count()
        if used:
            raise serializers.ValidationError(
                f"{instance.code} has been used on {used} "
                f"order{'' if used == 1 else 's'}, so it can't be deleted. "
                "Switch it off instead — it will stop working immediately."
            )
        instance.delete()

class AdminHomeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeStep
        fields = ["id", "label", "title", "text", "image", "sort_order"]


class AdminHomeStepViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminHomeStepSerializer
    queryset = HomeStep.objects.all()
    pagination_class = None


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


class AdminTestEmailView(APIView):
    """POST → send one test email to the restaurant's own address."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        from . import emails

        site = SiteSettings.load()
        ok, detail = emails.send_test(site.email)
        return Response({"ok": ok, "detail": detail, "to": site.email})


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
        today_orders = Order.objects.filter(created_at__date=today).exclude(
            status__in=["cancelled", "pending_payment"]
        )
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
            "total_orders": Order.objects.exclude(status="pending_payment").count(),
            "total_bookings": Booking.objects.count(),
        })
