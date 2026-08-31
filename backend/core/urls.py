from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import admin_api, views

router = DefaultRouter()
router.register("menu", views.MenuItemViewSet, basename="menu")
router.register("bookings", views.BookingViewSet, basename="booking")
router.register("orders", views.OrderViewSet, basename="order")
router.register("reviews", views.ReviewViewSet, basename="review")

admin_router = DefaultRouter()
admin_router.register("orders", admin_api.AdminOrderViewSet, basename="admin-order")
admin_router.register("bookings", admin_api.AdminBookingViewSet, basename="admin-booking")
admin_router.register("reviews", admin_api.AdminReviewViewSet, basename="admin-review")
admin_router.register("menu", admin_api.AdminMenuItemViewSet, basename="admin-menu")
admin_router.register("menu-photos", admin_api.AdminMenuItemPhotoViewSet, basename="admin-menu-photo")
admin_router.register("home-steps", admin_api.AdminHomeStepViewSet, basename="admin-home-steps")
admin_router.register("certifications", admin_api.AdminCertificationViewSet, basename="admin-cert")
admin_router.register("gallery", admin_api.AdminGalleryViewSet, basename="admin-gallery")
admin_router.register("announcements", admin_api.AdminAnnouncementViewSet, basename="admin-announcement")
admin_router.register("hours", admin_api.AdminOpeningHoursViewSet, basename="admin-hours")

urlpatterns = [
    path("", include(router.urls)),
    path("gallery/", views.GalleryPhotoListView.as_view(), name="gallery"),
    path("announcement/", views.AnnouncementView.as_view(), name="announcement"),
    path("campaigns/", views.CampaignListView.as_view(), name="campaigns"),
    path("hours/", views.OpeningHoursListView.as_view(), name="hours"),
    path("certifications/", views.CertificationListView.as_view(), name="certifications"),
    path("home-steps/", views.HomeStepListView.as_view(), name="home-steps"),
    path("site/", views.SiteSettingsView.as_view(), name="site"),
    path("admin/login/", admin_api.AdminLoginView.as_view(), name="admin-login"),
    path("admin/stats/", admin_api.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/site/", admin_api.AdminSiteSettingsView.as_view(), name="admin-site"),
    path("admin/remove-bg/", admin_api.AdminRemoveBgView.as_view(), name="admin-remove-bg"),
    path("admin/", include(admin_router.urls)),
]
