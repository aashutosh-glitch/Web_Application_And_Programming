import json
from datetime import date
from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Count, Sum
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import role_required
from .models import Booking, Payment, Room, User
from .services import calculate_total, is_room_available


def index(request):
    return render(request, "home.html")


def auth_page(request):
    return render(request, "auth.html")


def rooms_page(request):
    return render(request, "rooms.html")


def bookings_page(request):
    return render(request, "bookings.html")


def payments_page(request):
    return render(request, "payments.html")


def dashboard_page(request):
    return render(request, "dashboard.html")


def receptionist_page(request):
    return render(request, "receptionist.html")


def _json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def _parse_date(value):
    if isinstance(value, date):
        return value
    return parse_date(value) if value else None


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = _json_body(request)
    username = data.get("username")
    password = data.get("password")
    email = data.get("email", "")
    phone = data.get("phone", "")
    role = data.get("role", User.ROLE_CUSTOMER)

    if not username or not password:
        return JsonResponse({"error": "username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "username already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    user.phone = phone
    user.role = role
    user.save()
    return JsonResponse({"message": "registered", "user_id": user.id})


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    data = _json_body(request)
    username = data.get("username")
    password = data.get("password")

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({"message": "logged in", "role": user.role})


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "logged out"})


@login_required
@require_http_methods(["GET"])
def me(request):
    user = request.user
    return JsonResponse(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
        }
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
@login_required
def rooms(request):
    if request.method == "POST":
        if request.user.role not in [User.ROLE_ADMIN, User.ROLE_RECEPTIONIST]:
            return JsonResponse({"error": "Permission denied"}, status=403)
        data = _json_body(request)
        room = Room.objects.create(
            room_number=data.get("room_number"),
            room_type=data.get("room_type"),
            price=Decimal(data.get("price", "0")),
            status=data.get("status", Room.STATUS_AVAILABLE),
        )
        return JsonResponse({"message": "room created", "room_id": room.id})

    queryset = Room.objects.all()
    status = request.GET.get("status")
    room_type = request.GET.get("room_type")
    max_price = request.GET.get("max_price")

    if status:
        queryset = queryset.filter(status=status)
    if room_type:
        queryset = queryset.filter(room_type__iexact=room_type)
    if max_price:
        queryset = queryset.filter(price__lte=Decimal(max_price))

    rooms_data = [
        {
            "id": room.id,
            "room_number": room.room_number,
            "room_type": room.room_type,
            "price": str(room.price),
            "status": room.status,
        }
        for room in queryset
    ]
    return JsonResponse({"rooms": rooms_data})


@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def room_detail(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return JsonResponse({"error": "room not found"}, status=404)

    if request.method == "DELETE":
        room.delete()
        return JsonResponse({"message": "room deleted"})

    data = _json_body(request)
    for field in ["room_number", "room_type", "status"]:
        if field in data:
            setattr(room, field, data[field])
    if "price" in data:
        room.price = Decimal(data["price"])
    room.save()
    return JsonResponse({"message": "room updated"})


@csrf_exempt
@require_http_methods(["GET", "POST"])
@login_required
def bookings(request):
    if request.method == "POST":
        if request.user.role not in [User.ROLE_CUSTOMER, User.ROLE_RECEPTIONIST, User.ROLE_ADMIN]:
            return JsonResponse({"error": "Permission denied"}, status=403)

        data = _json_body(request)
        room_id = data.get("room_id")
        check_in = _parse_date(data.get("check_in_date"))
        check_out = _parse_date(data.get("check_out_date"))

        if not all([room_id, check_in, check_out]):
            return JsonResponse({"error": "room_id, check_in_date, check_out_date required"}, status=400)

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return JsonResponse({"error": "room not found"}, status=404)

        if room.status == Room.STATUS_MAINTENANCE:
            return JsonResponse({"error": "room under maintenance"}, status=400)

        if not is_room_available(room, check_in, check_out):
            return JsonResponse({"error": "room not available"}, status=400)

        total = calculate_total(room, check_in, check_out)
        if total <= 0:
            return JsonResponse({"error": "invalid date range"}, status=400)

        with transaction.atomic():
            booking = Booking.objects.create(
                user=request.user,
                room=room,
                check_in_date=check_in,
                check_out_date=check_out,
                total_amount=total,
                booking_status=Booking.STATUS_CONFIRMED,
            )
            room.status = Room.STATUS_BOOKED
            room.save()

        return JsonResponse({"message": "booking created", "booking_id": booking.id})

    if request.user.role in [User.ROLE_ADMIN, User.ROLE_RECEPTIONIST]:
        queryset = Booking.objects.select_related("user", "room")
    else:
        queryset = Booking.objects.filter(user=request.user).select_related("room")

    data = [
        {
            "id": booking.id,
            "user": booking.user.username,
            "room_number": booking.room.room_number,
            "check_in_date": booking.check_in_date.isoformat(),
            "check_out_date": booking.check_out_date.isoformat(),
            "total_amount": str(booking.total_amount),
            "booking_status": booking.booking_status,
        }
        for booking in queryset
    ]
    return JsonResponse({"bookings": data})


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def booking_cancel(request, booking_id):
    try:
        booking = Booking.objects.select_related("room").get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "booking not found"}, status=404)

    if request.user.role == User.ROLE_CUSTOMER and booking.user_id != request.user.id:
        return JsonResponse({"error": "Permission denied"}, status=403)

    booking.booking_status = Booking.STATUS_CANCELLED
    booking.save()

    room = booking.room
    room.status = Room.STATUS_AVAILABLE
    room.save()

    return JsonResponse({"message": "booking cancelled"})


@csrf_exempt
@require_http_methods(["POST"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def booking_checkin(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "booking not found"}, status=404)

    booking.booking_status = Booking.STATUS_CHECKED_IN
    booking.save()
    return JsonResponse({"message": "checked in"})


@csrf_exempt
@require_http_methods(["POST"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def booking_checkout(request, booking_id):
    try:
        booking = Booking.objects.select_related("room").get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "booking not found"}, status=404)

    booking.booking_status = Booking.STATUS_CHECKED_OUT
    booking.save()

    room = booking.room
    room.status = Room.STATUS_AVAILABLE
    room.save()

    return JsonResponse({"message": "checked out"})


@csrf_exempt
@require_http_methods(["POST"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def payments(request):
    data = _json_body(request)
    booking_id = data.get("booking_id")
    amount = data.get("amount")
    method = data.get("payment_method", Payment.METHOD_CASH)
    status = data.get("payment_status", Payment.STATUS_PAID)

    if not booking_id or amount is None:
        return JsonResponse({"error": "booking_id and amount required"}, status=400)

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "booking not found"}, status=404)

    payment, _ = Payment.objects.update_or_create(
        booking=booking,
        defaults={
            "amount": Decimal(amount),
            "payment_method": method,
            "payment_status": status,
        },
    )
    return JsonResponse({"message": "payment recorded", "payment_id": payment.id})


@require_http_methods(["GET"])
@role_required([User.ROLE_ADMIN])
def dashboard(request):
    total_revenue = Payment.objects.filter(payment_status=Payment.STATUS_PAID).aggregate(
        total=Sum("amount")
    )["total"] or Decimal("0.00")

    occupancy = Room.objects.filter(status=Room.STATUS_BOOKED).count()
    total_rooms = Room.objects.count()

    bookings_by_status = (
        Booking.objects.values("booking_status")
        .annotate(total=Count("id"))
        .order_by("booking_status")
    )

    return JsonResponse(
        {
            "total_revenue": str(total_revenue),
            "occupancy": occupancy,
            "total_rooms": total_rooms,
            "bookings_by_status": list(bookings_by_status),
        }
    )


@require_http_methods(["GET"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def reception_summary(request):
    total_rooms = Room.objects.count()
    available = Room.objects.filter(status=Room.STATUS_AVAILABLE).count()
    occupied = Room.objects.filter(status=Room.STATUS_BOOKED).count()
    maintenance = Room.objects.filter(status=Room.STATUS_MAINTENANCE).count()

    by_type = (
        Room.objects.values("room_type")
        .annotate(total=Count("id"))
        .order_by("room_type")
    )

    return JsonResponse(
        {
            "total_rooms": total_rooms,
            "available": available,
            "occupied": occupied,
            "maintenance": maintenance,
            "rooms_by_type": list(by_type),
        }
    )


@require_http_methods(["GET"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def availability(request):
    room_type = request.GET.get("room_type")
    check_in = _parse_date(request.GET.get("check_in_date"))
    check_out = _parse_date(request.GET.get("check_out_date"))

    if not check_in or not check_out:
        return JsonResponse(
            {"error": "check_in_date and check_out_date are required"}, status=400
        )

    queryset = Room.objects.filter(status=Room.STATUS_AVAILABLE)
    if room_type:
        queryset = queryset.filter(room_type__iexact=room_type)

    available_rooms = []
    for room in queryset:
        if is_room_available(room, check_in, check_out):
            available_rooms.append(
                {
                    "id": room.id,
                    "room_number": room.room_number,
                    "room_type": room.room_type,
                    "price": str(room.price),
                }
            )

    return JsonResponse({"available_rooms": available_rooms})


@csrf_exempt
@require_http_methods(["POST"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def allocate_room(request):
    data = _json_body(request)
    username = data.get("username")
    room_id = data.get("room_id")
    check_in = _parse_date(data.get("check_in_date"))
    check_out = _parse_date(data.get("check_out_date"))

    if not all([username, room_id, check_in, check_out]):
        return JsonResponse(
            {"error": "username, room_id, check_in_date, check_out_date required"},
            status=400,
        )

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "user not found"}, status=404)

    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return JsonResponse({"error": "room not found"}, status=404)

    if room.status == Room.STATUS_MAINTENANCE:
        return JsonResponse({"error": "room under maintenance"}, status=400)

    if not is_room_available(room, check_in, check_out):
        return JsonResponse({"error": "room not available"}, status=400)

    total = calculate_total(room, check_in, check_out)
    if total <= 0:
        return JsonResponse({"error": "invalid date range"}, status=400)

    with transaction.atomic():
        booking = Booking.objects.create(
            user=user,
            room=room,
            check_in_date=check_in,
            check_out_date=check_out,
            total_amount=total,
            booking_status=Booking.STATUS_CONFIRMED,
        )
        room.status = Room.STATUS_BOOKED
        room.save()

    return JsonResponse({"message": "room allocated", "booking_id": booking.id})


@csrf_exempt
@require_http_methods(["POST"])
@role_required([User.ROLE_ADMIN, User.ROLE_RECEPTIONIST])
def deallocate_room(request, booking_id):
    try:
        booking = Booking.objects.select_related("room").get(id=booking_id)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "booking not found"}, status=404)

    booking.booking_status = Booking.STATUS_CANCELLED
    booking.save()

    room = booking.room
    room.status = Room.STATUS_AVAILABLE
    room.save()

    return JsonResponse({"message": "room deallocated"})
