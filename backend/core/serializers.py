from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

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


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            "slug", "name", "description", "price", "tag", "heat",
            "kcal", "protein_g", "prep_time", "image", "is_featured",
        ]


class BookingSerializer(serializers.ModelSerializer):
    # required on the public form (confirmation emails go here), even though
    # the model allows blank for staff-entered phone bookings
    email = serializers.EmailField()

    class Meta:
        model = Booking
        fields = [
            "public_id", "name", "email", "phone", "date", "time",
            "party_size", "notes", "status", "created_at",
        ]
        read_only_fields = ["public_id", "status", "created_at"]

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
    items = OrderItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = [
            "public_id", "customer_name", "email", "phone", "notes",
            "status", "cancel_reason", "items", "total", "created_at",
        ]
        read_only_fields = ["public_id", "status", "cancel_reason", "created_at"]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False, write_only=True)

    class Meta:
        model = Order
        fields = ["customer_name", "email", "phone", "notes", "items"]

    MAX_TOTAL_QUANTITY = 50

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
        return order

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "suburb", "rating", "quote", "avatar", "created_at"]
        read_only_fields = ["id", "created_at"]


class GalleryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryPhoto
        fields = ["id", "album", "caption", "image", "alt"]


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["message", "link_text", "link_url"]


class OpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ["label", "opens", "closes"]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["icon", "title", "subtitle"]


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "hero_heading", "hero_script", "hero_lead", "hero_image",
            "about_text", "address", "phone", "email", "abn",
            "map_embed", "instagram_url", "facebook_url", "timezone",
            "theme",
        ]
