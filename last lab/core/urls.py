from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("me/", views.me),
    path("rooms/", views.rooms),
    path("rooms/<int:room_id>/", views.room_detail),
    path("bookings/", views.bookings),
    path("bookings/<int:booking_id>/cancel/", views.booking_cancel),
    path("bookings/<int:booking_id>/checkin/", views.booking_checkin),
    path("bookings/<int:booking_id>/checkout/", views.booking_checkout),
    path("payments/", views.payments),
    path("dashboard/", views.dashboard),
    path("reception/summary/", views.reception_summary),
    path("reception/availability/", views.availability),
    path("reception/allocate/", views.allocate_room),
    path("reception/deallocate/<int:booking_id>/", views.deallocate_room),
]
