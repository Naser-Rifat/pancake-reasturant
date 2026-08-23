"""Staff-only API consumed by the custom Next.js admin panel (/admin)."""
from django.contrib.auth import authenticate
from django.db.models import F, Sum
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import mixins, serializers, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import emails
from .models import Booking, MenuItem, Order, OrderItem, Review
from .serializers import OrderSerializer


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
            "protein_g", "prep_time", "image", "is_featured", "is_available",
            "sort_order",
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
