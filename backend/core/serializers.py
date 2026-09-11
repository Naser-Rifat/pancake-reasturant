import re
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

def validate_phone_number(phone: str) -> str:
    cleaned = (phone or "").strip()
    if not cleaned:
        return ""
    if not re.match(r"^[+]?[\d\s\-().]+$", cleaned):
        raise serializers.ValidationError("Phone number can only contain digits, spaces, and a leading '+'.")
    if cleaned.find("+", 1) != -1:
        raise serializers.ValidationError("Country code '+' must be at the beginning of the number.")
    digits = re.sub(r"\D", "", cleaned)
    if len(digits) < 8:
        raise serializers.ValidationError("Phone number is too short (minimum 8 digits).")
    if len(digits) > 15:
        raise serializers.ValidationError("Phone number is too long (maximum 15 digits).")
    if cleaned.startswith("+") and digits.startswith("0"):
        raise serializers.ValidationError("Invalid international country code (cannot start with +0).")
    if len(set(digits)) == 1:
        raise serializers.ValidationError("Please enter a real phone number.")
    return cleaned

from .models import (
    Announcement,
    Booking,
    Category,
    Certification,
    Coupon,
    GalleryPhoto,
    HomeStep,
    MenuItem,
    MenuItemPhoto,
    OpeningHours,
    Order,
    OrderItem,
    Review,
    SiteSettings,
)


class CategorySerializer(serializers.ModelSerializer):
    dish_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "description",
            "sort_order",
            "is_active",
            "dish_count",
        ]


class MenuItemPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemPhoto
        fields = ["id", "image", "alt", "sort_order"]


class MenuItemSerializer(serializers.ModelSerializer):
    photos = MenuItemPhotoSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    category_slug = serializers.CharField(source="category.slug", read_only=True, default="")
    category_icon = serializers.CharField(source="category.icon", read_only=True, default="🥞")

    class Meta:
        model = MenuItem
        fields = [
            "slug", "name", "description", "price", "tag", "category",
            "category_name", "category_slug", "category_icon", "heat",
            "kcal", "protein_g", "prep_time", "image", "photo", "photos",
            "is_featured",
        ]


class BookingSerializer(serializers.ModelSerializer):
    # required on the public form (confirmation emails go here), even though
    # the model allows blank for staff-entered phone bookings
    email = serializers.EmailField()

    class Meta:
        model = Booking
        fields = [
            "public_id", "name", "email", "phone", "date", "time",
            "party_size", "preselected_dish", "notes", "status", "created_at",
        ]
        read_only_fields = ["public_id", "status", "created_at"]

    def validate_phone(self, value):
        return validate_phone_number(value)

    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Booking date cannot be in the past.")
        return value

    def validate(self, data):
        if data["date"] == timezone.localdate() and data["time"] < timezone.localtime().time():
            raise serializers.ValidationError({"time": "Booking time has already passed."})
        return data


class OrderItemInputSerializer(serializers.Serializer):
    slug = serializers.SlugField()
    quantity = serializers.IntegerField(min_value=1, max_value=20)


class OrderItemSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(source="menu_item.slug", read_only=True)
    name = serializers.CharField(source="menu_item.name", read_only=True)
    line_total = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["slug", "name", "quantity", "unit_price", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    """Public shape — anyone holding the order link can fetch this, so no
    contact details here; staff get them via AdminOrderSerializer."""

    items = OrderItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = [
            "public_id", "customer_name",
            "status", "payment_status", "cancel_reason", "items",
            "subtotal", "coupon_code", "discount_amount", "total", "created_at",
        ]
        read_only_fields = ["public_id", "status", "payment_status", "cancel_reason", "created_at"]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False, write_only=True)
    # the browser sends a CODE and nothing else — every dollar is worked out
    # here, the same rule the item price snapshot already follows
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=24)

    class Meta:
        model = Order
        fields = ["customer_name", "email", "phone", "notes", "items", "coupon_code"]

    MAX_TOTAL_QUANTITY = 50

    def validate_phone(self, value):
        return validate_phone_number(value)

    def validate(self, attrs):
        settings = SiteSettings.load()
        if not settings.online_ordering_enabled:
            raise serializers.ValidationError(
                settings.online_ordering_disabled_message or "Online ordering is currently paused."
            )
        return attrs

    def validate_items(self, items):
        slugs = [i["slug"] for i in items]
        if len(slugs) != len(set(slugs)):
            raise serializers.ValidationError("Duplicate items — merge quantities instead.")
        if sum(i["quantity"] for i in items) > self.MAX_TOTAL_QUANTITY:
            raise serializers.ValidationError(
                f"Orders are limited to {self.MAX_TOTAL_QUANTITY} items — please call us for catering."
            )
        menu_items = MenuItem.objects.filter(slug__in=slugs, is_available=True)
        found = {m.slug: m for m in menu_items}
        missing = [s for s in slugs if s not in found]
        if missing:
            raise serializers.ValidationError(f"Unknown or unavailable items: {', '.join(missing)}")
        # stash resolved objects so create() doesn't re-query
        self._resolved = found
        return items

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        code = (validated_data.pop("coupon_code", "") or "").strip().upper()
        order = Order.objects.create(**validated_data)
        OrderItem.objects.bulk_create(
            OrderItem(
                order=order,
                menu_item=self._resolved[i["slug"]],
                quantity=i["quantity"],
                unit_price=self._resolved[i["slug"]].price,  # server-side price snapshot
            )
            for i in items
        )
        if code:
            apply_coupon(order, code)
        return order

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data


# Stripe will not open a Checkout Session below its minimum charge, so a code
# worth more than the cart cannot simply zero the order.
STRIPE_MIN_CHARGE = Decimal("0.50")


def price_with_coupon(code, subtotal):
    """(coupon, discount) for `code` against `subtotal`, or raise ValidationError.

    Shared by the cart's live preview and by order creation, so the number the
    customer is shown is produced by exactly the code that charges them.
    """
    try:
        coupon = Coupon.objects.get(code=code.strip().upper())
    except Coupon.DoesNotExist:
        raise serializers.ValidationError({"coupon_code": "That code isn't valid."})

    reason = coupon.unusable_reason(subtotal)
    if reason:
        raise serializers.ValidationError({"coupon_code": reason})

    discount = coupon.discount_for(subtotal)
    if subtotal - discount < STRIPE_MIN_CHARGE:
        raise serializers.ValidationError(
            {"coupon_code": "That code covers your whole order — please call us to arrange it."}
        )
    return coupon, discount


def apply_coupon(order, code):
    """Attach the coupon to a fresh order and RESERVE one redemption.

    Reserved, not spent: the order is unpaid at this point. Stripe's
    checkout.session.expired webhook hands the redemption back (see
    payments.release_coupon), so an abandoned cart cannot burn a limited code.
    The row is locked because two carts can hold the last redemption at once.
    """
    subtotal = order.subtotal
    coupon, discount = price_with_coupon(code, subtotal)

    locked = Coupon.objects.select_for_update().get(pk=coupon.pk)
    # re-check under the lock: the limit may have gone in between
    if locked.is_exhausted:
        raise serializers.ValidationError(
            {"coupon_code": "That code has been fully claimed."}
        )
    locked.times_used += 1
    locked.save(update_fields=["times_used"])

    order.coupon = locked
    order.coupon_code = locked.code
    order.discount_amount = discount
    order.save(update_fields=["coupon", "coupon_code", "discount_amount"])
    return discount

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "suburb", "rating", "quote", "avatar", "created_at"]
        read_only_fields = ["id", "created_at"]


class GalleryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryPhoto
        fields = ["id", "album", "caption", "image", "alt", "focus"]


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["message", "details", "link_text", "link_url", "image", "ends_at", "card1_dish", "card2_dish"]


class OpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ["label", "opens", "closes"]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["icon", "image", "title", "subtitle"]


class HomeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeStep
        fields = ["id", "label", "title", "text", "image", "sort_order"]


class SiteSettingsSerializer(serializers.ModelSerializer):
    custom_primary = serializers.RegexField(r"^#[0-9a-fA-F]{6}$", required=False)
    custom_accent = serializers.RegexField(r"^#[0-9a-fA-F]{6}$", required=False)

    class Meta:
        model = SiteSettings
        fields = [
            "hero_heading", "hero_script", "hero_lead", "hero_image", "hero_cutout",
            "about_text", "about_heading", "about_script",
            "about_image_1", "about_image_2", "about_image_3", "about_points",
            "cta_heading", "cta_script", "cta_lead", "cta_button_label", "cta_button_url",
            "marquee_words", "footer_tagline",
            "promo_kicker", "offers_kicker", "offers_title",
            "menu_hero_heading", "menu_hero_script", "menu_hero_lead", "gallery_hero_kicker", "gallery_hero_heading", "gallery_hero_script", "gallery_hero_lead", "booking_hero_kicker", "booking_hero_heading", "booking_hero_script", "booking_hero_lead",
            "address", "phone", "whatsapp", "email", "abn",
            "map_embed", "transit_badges", "show_transit_badges",
            "instagram_url", "facebook_url", "uber_eats_url",
            "online_ordering_enabled", "online_ordering_disabled_message",
            "timezone", "theme", "custom_primary", "custom_accent",
        ]
