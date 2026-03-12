const output = document.getElementById("output");

function show(data) {
  if (!output) return;
  output.textContent = JSON.stringify(data, null, 2);
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    show(data);
    throw new Error(data.error || "Request failed");
  }
  show(data);
  return data;
}

async function register() {
  return request("/api/register/", {
    method: "POST",
    body: JSON.stringify({
      username: document.getElementById("reg-username").value,
      email: document.getElementById("reg-email").value,
      phone: document.getElementById("reg-phone").value,
      password: document.getElementById("reg-password").value,
      role: document.getElementById("reg-role").value,
    }),
  });
}

async function login() {
  return request("/api/login/", {
    method: "POST",
    body: JSON.stringify({
      username: document.getElementById("login-username").value,
      password: document.getElementById("login-password").value,
    }),
  });
}

async function logout() {
  return request("/api/logout/", { method: "POST" });
}

async function me() {
  return request("/api/me/");
}

async function createRoom() {
  return request("/api/rooms/", {
    method: "POST",
    body: JSON.stringify({
      room_number: document.getElementById("room-number").value,
      room_type: document.getElementById("room-type").value,
      price: document.getElementById("room-price").value,
      status: document.getElementById("room-status").value,
    }),
  });
}

async function listRooms() {
  return request("/api/rooms/");
}

async function createBooking() {
  return request("/api/bookings/", {
    method: "POST",
    body: JSON.stringify({
      room_id: document.getElementById("booking-room").value,
      check_in_date: document.getElementById("booking-checkin").value,
      check_out_date: document.getElementById("booking-checkout").value,
    }),
  });
}

async function listBookings() {
  return request("/api/bookings/");
}

async function recordPayment() {
  return request("/api/payments/", {
    method: "POST",
    body: JSON.stringify({
      booking_id: document.getElementById("payment-booking").value,
      amount: document.getElementById("payment-amount").value,
      payment_method: document.getElementById("payment-method").value,
      payment_status: document.getElementById("payment-status").value,
    }),
  });
}

async function dashboard() {
  return request("/api/dashboard/");
}

async function receptionSummary() {
  return request("/api/reception/summary/");
}

async function checkAvailability() {
  const roomType = document.getElementById("avail-room-type").value;
  const checkIn = document.getElementById("avail-checkin").value;
  const checkOut = document.getElementById("avail-checkout").value;
  const params = new URLSearchParams({
    check_in_date: checkIn,
    check_out_date: checkOut,
  });
  if (roomType) params.append("room_type", roomType);
  return request(`/api/reception/availability/?${params.toString()}`);
}

async function allocateRoom() {
  return request("/api/reception/allocate/", {
    method: "POST",
    body: JSON.stringify({
      username: document.getElementById("alloc-username").value,
      room_id: document.getElementById("alloc-room-id").value,
      check_in_date: document.getElementById("alloc-checkin").value,
      check_out_date: document.getElementById("alloc-checkout").value,
    }),
  });
}

async function deallocateRoom() {
  const bookingId = document.getElementById("dealloc-booking-id").value;
  return request(`/api/reception/deallocate/${bookingId}/`, {
    method: "POST",
  });
}
