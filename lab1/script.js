

// ---- CALENDAR ----

// Track current month/year being shown
let currentDate = new Date();
let currentMonth = currentDate.getMonth();   // 0 = Jan, 11 = Dec
let currentYear  = currentDate.getFullYear();

// Store events: { "2026-03-15": "Lab submission", ... }
let events = JSON.parse(localStorage.getItem("portfolioEvents")) || {};

// Array of month names for display
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// Main function: render calendar for given month/year
function renderCalendar(month, year) {
  // Update the header text
  document.getElementById("monthYear").textContent = `${monthNames[month]} ${year}`;

  const container = document.getElementById("calendarDays");
  container.innerHTML = ""; // clear previous days

  // Find what day of the week the 1st falls on (0=Sun, 6=Sat)
  const firstDay = new Date(year, month, 1).getDay();

  // Find how many days are in this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Today's date for highlighting
  const todayDate = new Date();

  // Add empty cells before the first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.classList.add("calendar-day", "empty");
    container.appendChild(empty);
  }

  // Add each day
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.classList.add("calendar-day");
    cell.textContent = d;

    // Build date key: "YYYY-MM-DD"
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateKey = `${year}-${mm}-${dd}`;

    // Highlight today
    if (
      d === todayDate.getDate() &&
      month === todayDate.getMonth() &&
      year === todayDate.getFullYear()
    ) {
      cell.classList.add("today");
    }

    // Highlight days with events
    if (events[dateKey]) {
      cell.classList.add("has-event");
      cell.title = events[dateKey]; // tooltip on hover
    }

    container.appendChild(cell);
  }

  // Render the events list below
  renderEventList();
}

// Navigate to previous month
document.getElementById("prevBtn").addEventListener("click", function () {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
});

// Navigate to next month
document.getElementById("nextBtn").addEventListener("click", function () {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
});

// Add a new event
function addEvent() {
  const dateInput = document.getElementById("eventDate").value;
  const nameInput = document.getElementById("eventName").value.trim();

  if (!dateInput || !nameInput) {
    alert("Please fill in both date and event name!");
    return;
  }

  // Save to events object and localStorage
  events[dateInput] = nameInput;
  localStorage.setItem("portfolioEvents", JSON.stringify(events));

  // Clear inputs
  document.getElementById("eventDate").value = "";
  document.getElementById("eventName").value = "";

  // Re-render calendar
  renderCalendar(currentMonth, currentYear);
}

// Render the list of saved events
function renderEventList() {
  const ul = document.getElementById("eventItems");
  ul.innerHTML = "";

  // Sort events by date
  const sorted = Object.entries(events).sort((a, b) => a[0].localeCompare(b[0]));

  if (sorted.length === 0) {
    ul.innerHTML = "<li style='color:var(--muted);font-size:0.85rem;'>No events yet.</li>";
    return;
  }

  sorted.forEach(([date, name]) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${name}</span>
      <span class="ev-date">${date}</span>
      <button class="ev-del" onclick="deleteEvent('${date}')" title="Delete">✕</button>
    `;
    ul.appendChild(li);
  });
}

// Delete an event
function deleteEvent(dateKey) {
  delete events[dateKey];
  localStorage.setItem("portfolioEvents", JSON.stringify(events));
  renderCalendar(currentMonth, currentYear);
}

// ---- CONTACT FORM ----
function handleContact(event) {
  event.preventDefault(); // stop the page from reloading
  alert("✅ Message sent! (In a real app, this would send an email.)");
  event.target.reset(); // clear the form
}

// ---- INIT ----
// Render calendar on page load
renderCalendar(currentMonth, currentYear);
