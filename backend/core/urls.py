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

urlpatterns = [
    path("", include(router.urls)),
    path("gallery/", views.GalleryPhotoListView.as_view(), name="gallery"),
    path("announcement/", views.AnnouncementView.as_view(), name="announcement"),
    path("hours/", views.OpeningHoursListView.as_view(), name="hours"),
    path("admin/login/", admin_api.AdminLoginView.as_view(), name="admin-login"),
    path("admin/stats/", admin_api.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/", include(admin_router.urls)),
]
