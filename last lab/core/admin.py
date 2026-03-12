from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Room, Booking, Payment


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Role & Contact", {"fields": ("role", "phone")}),
    )
    list_display = ("username", "email", "role", "is_staff")


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("room_number", "room_type", "price", "status")
    list_filter = ("status", "room_type")
    search_fields = ("room_number",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "room", "check_in_date", "check_out_date", "booking_status")
    list_filter = ("booking_status", "check_in_date")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "amount", "payment_method", "payment_status")
    list_filter = ("payment_status", "payment_method")
