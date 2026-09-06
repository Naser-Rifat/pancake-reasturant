from django.contrib import admin

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
