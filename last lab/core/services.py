from datetime import date
from decimal import Decimal
from django.db.models import Q
from .models import Room, Booking


def is_room_available(room: Room, check_in: date, check_out: date) -> bool:
    overlapping = Booking.objects.filter(
        room=room,
        booking_status__in=[
            Booking.STATUS_CONFIRMED,
            Booking.STATUS_CHECKED_IN,
        ],
    ).filter(
        Q(check_in_date__lt=check_out) & Q(check_out_date__gt=check_in)
    )
    return not overlapping.exists()


def calculate_total(room: Room, check_in: date, check_out: date) -> Decimal:
    nights = (check_out - check_in).days
    if nights <= 0:
        return Decimal("0.00")
    return room.price * nights
