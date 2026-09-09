from django.contrib import admin

from .models import (
    Announcement,
    Booking,
    Certification,
    Coupon,
    GalleryPhoto,
    MenuItem,
    OpeningHours,
    Order,
    OrderItem,
    Review,
    SiteSettings,
)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "tag", "heat", "is_featured", "is_available", "sort_order"]
    list_editable = ["is_featured", "is_available", "sort_order"]
    list_filter = ["tag", "heat", "is_featured", "is_available"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["name", "date", "time", "party_size", "phone", "status", "created_at"]
    list_editable = ["status"]
    list_filter = ["status", "date"]
    search_fields = ["name", "email", "phone"]
    date_hierarchy = "date"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["public_id", "customer_name", "status", "total", "created_at"]
    list_editable = ["status"]
    list_filter = ["status"]
    search_fields = ["customer_name", "email", "phone", "public_id"]
    inlines = [OrderItemInline]

    def total(self, obj):
        return obj.total


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    """Django admin is the backup tooling for coupons until the staff panel
    grows its own page — without this there is no way to create a code on a
    deployed server at all."""

    list_display = (
        "code", "discount_label", "is_active", "times_used", "usage_limit",
        "starts_at", "ends_at",
    )
    list_filter = ("is_active", "kind")
    search_fields = ("code", "description")
    # a ledger of redemptions, not a setting — editing it by hand would hand
    # out or destroy uses that no order accounts for
    readonly_fields = ("times_used", "created_at", "updated_at")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["name", "suburb", "rating", "is_approved", "created_at"]
    list_editable = ["is_approved"]
    list_filter = ["is_approved", "rating"]
    search_fields = ["name", "quote"]


@admin.register(GalleryPhoto)
class GalleryPhotoAdmin(admin.ModelAdmin):
    list_display = ["caption", "album", "sort_order"]
    list_editable = ["sort_order"]
    list_filter = ["album"]


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["message", "is_active", "starts_at", "ends_at"]
    list_editable = ["is_active"]


@admin.register(OpeningHours)
class OpeningHoursAdmin(admin.ModelAdmin):
    list_display = ["label", "opens", "closes", "sort_order"]
    list_editable = ["sort_order"]


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ["icon", "title", "subtitle", "is_active", "sort_order"]
    list_editable = ["is_active", "sort_order"]


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()  # singleton

    def has_delete_permission(self, request, obj=None):
        return False
