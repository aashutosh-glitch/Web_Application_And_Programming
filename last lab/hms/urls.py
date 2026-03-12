from django.contrib import admin
from django.urls import include, path
from core import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("", views.index, name="index"),
    path("auth/", views.auth_page, name="auth_page"),
    path("rooms/", views.rooms_page, name="rooms_page"),
    path("bookings/", views.bookings_page, name="bookings_page"),
    path("payments/", views.payments_page, name="payments_page"),
    path("dashboard/", views.dashboard_page, name="dashboard_page"),
    path("reception/", views.receptionist_page, name="receptionist_page"),
]
