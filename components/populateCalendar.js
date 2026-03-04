const eventLinkMap = new Map();

// await --- before we can continue, we have to wait for the response from another computer/the server
//res = response

async function populateGoogleCal() {
  var selectMonth = document.getElementById("month");
  var selectYear = document.getElementById("year");

  try {
    //fetch --- go get something from another computer/the server
    //res is a constant NOT CONSTRUCT, after RESOLVING THE PROMISE using .then, we grab the JSON body and store it in res
    //? denotes query parameters, which are used to send data to the server. in this case, we are sending the month and year
    // selected by the user to the server, so that the server can get the correct events from the Google Calendar API.
    // document.getElementById IS CLIENT SIDE
    const res = await fetch(
      `/api/callinggoogle?month=${selectMonth.value}&year=${selectYear.value}`,
    ).then((response) => response.json());

    // Call AssignCalEvents after fetching data
    AssignCalEvents(res);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    document.getElementById("rR").textContent =
      "Sorry, Sarah. You messed up! Error loading calendar: " + error.message;
  }
}

function AssignCalEvents(res) {
  const thisMonthsEvents = res;

  /** Helper to decide a CSS category class based on the event title */
  function getCategoryClass(summary) {
    if (!summary) return "";
    const s = summary.toLowerCase();
    if (
      s.includes("yap and snack") ||
      s.includes("open crafting for teens") ||
      s.includes("for teens") ||
      s.includes("teen tournament")
    ) {
      return "teens";
    }
    if (
      s.includes("let's play tuesdays") ||
      s.includes("puzzles, chess, and magic") ||
      s.includes("for tweens") ||
      s.includes("laser tag")
    ) {
      return "tweens";
    }
    if (
      s.includes("littles' storytime") ||
      s.includes("littles' art studio") ||
      s.includes("drums & strings") ||
      s.includes("babies") ||
      s.includes("cantos y cuentos") ||
      s.includes("birth to three play") ||
      s.includes("baby stories and senses")
    ) {
      return "babies";
    }
    if (
      s.includes("storycraft") ||
      s.includes("tales and tunes") ||
      s.includes("bark") ||
      s.includes("kids") ||
      s.includes("stem saturday") ||
      s.includes("makerspace") ||
      s.includes("family fun night") ||
      s.includes("family night")
    ) {
      return "kids";
    }
    if (
      s.includes("snowflake festival") ||
      s.includes("kickoff") ||
      s.includes("endgames") ||
      s.includes("intergenerational") ||
      s.includes("all ages")
    ) {
      return "intergen";
    }
    return "intergen";
  }

  // ── Clear previous desktop events ──
  document.querySelectorAll(".event-item").forEach((el) => el.remove());

  // ── Clear previous mobile list ──
  const mobileView = document.getElementById("mobile-view");
  if (mobileView) mobileView.innerHTML = "";

  // Handle both array and object responses
  const events = Array.isArray(thisMonthsEvents)
    ? thisMonthsEvents
    : thisMonthsEvents?.items || [];

  // ── Store all parsed events for mobile rendering ──
  const parsedEvents = [];

  // ── Loop: build desktop calendar cells ──
  events.forEach((event) => {
    const startDateTime = new Date(event.start.dateTime);
    const year = startDateTime.getFullYear();
    const month = String(startDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(startDateTime.getDate()).padStart(2, "0");
    const dateId = `date-${year}-${month}-${day}`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initTooltips();
      });
    });

    const startTime = startDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endDateTime = new Date(event.end.dateTime);
    const endTime = endDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const cat = getCategoryClass(event.summary);

    // ── Desktop cell ──
    const cell = document.getElementById(dateId);
    if (cell) {
      const eventEl = document.createElement("div");
      eventEl.className = "event-item";
      eventLinkMap.set(eventEl, event.htmlLink); // Store the event's HTML link in the map for later retrieval
      if (cat) eventEl.classList.add(cat);
      eventEl.innerHTML = `
        <div class="event-summary">${event.summary}</div>
        <div class="event-time">${startTime} - ${endTime}</div>
        <div class="event-description">${event.description || ""}</div>
      `;
      cell.appendChild(eventEl);
    }

    // ── Collect for mobile ──
    parsedEvents.push({
      summary: event.summary || "(Untitled)",
      startDateTime,
      endDateTime,
      timeRange: `${startTime} – ${endTime}`,
      description: event.description || "",
      htmlLink: event.htmlLink || null,
      category: cat,
      dateKey: `${year}-${month}-${day}`, // YYYY-MM-DD for grouping
    });
  });

  // ── Build mobile list view ──
  window._lastParsedEvents = parsedEvents; // cache for view toggle
  buildMobileView(parsedEvents);

  // after inserting all events, apply filters in case toggles/search are active
  if (typeof searchCal === "function") {
    window.searchCal();
  }
}

/**
 * Renders the mobile view.
 * mode = 'upcoming' → next 3 days that actually have events (from today onward)
 * mode = 'full'     → full week-by-week list of all events this month
 */
function buildMobileView(events) {
  const mobileView = document.getElementById("mobile-view");
  if (!mobileView) return;
  mobileView.innerHTML = "";

  // Update the mobile month/year heading
  const mobileHeading = document.getElementById("monthAndYearMobile");
  const desktopHeading = document.getElementById("monthAndYear");
  if (mobileHeading && desktopHeading) {
    mobileHeading.textContent = desktopHeading.textContent;
  }

  // Sync active button state
  const mode = window.mobileViewMode || "upcoming";
  const btnUpcoming = document.getElementById("btn-upcoming");
  const btnFull = document.getElementById("btn-full");
  if (btnUpcoming) btnUpcoming.classList.toggle("active", mode === "upcoming");
  if (btnFull) btnFull.classList.toggle("active", mode === "full");

  if (events.length === 0) {
    mobileView.innerHTML = `<div class="mobile-empty">No events this month.</div>`;
    return;
  }

  // Sort events ascending by start time
  const sorted = [...events].sort((a, b) => a.startDateTime - b.startDateTime);

  let displayEvents = sorted;

  if (mode === "upcoming") {
    // Collect unique future dateKeys (today or later)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const futureDays = [];
    const seenDays = new Set();
    sorted.forEach((ev) => {
      const evDay = new Date(ev.startDateTime);
      evDay.setHours(0, 0, 0, 0);
      if (evDay >= todayStart && !seenDays.has(ev.dateKey)) {
        seenDays.add(ev.dateKey);
        futureDays.push(ev.dateKey);
      }
    });
    // Take only the first 3 days that have events
    const next3Days = new Set(futureDays.slice(0, 3));
    displayEvents = sorted.filter((ev) => next3Days.has(ev.dateKey));

    if (displayEvents.length === 0) {
      mobileView.innerHTML = `<div class="mobile-empty">No upcoming events this month.<br><small>Switch to Full Month to see all events.</small></div>`;
      return;
    }
  }

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (mode === "upcoming") {
    // Flat day groups, no week labels
    const dayMap = new Map();
    displayEvents.forEach((ev) => {
      if (!dayMap.has(ev.dateKey)) dayMap.set(ev.dateKey, []);
      dayMap.get(ev.dateKey).push(ev);
    });
    dayMap.forEach((dayEvents, dateKey) => {
      const [yr, mo, dy] = dateKey.split("-").map(Number);
      const dateObj = new Date(yr, mo - 1, dy);
      const isToday = dateObj.getTime() === today.getTime();
      mobileView.appendChild(
        buildDayGroup(dateKey, dayEvents, isToday, DAY_NAMES),
      );
    });
  } else {
    // Group by week (Sun-Sat)
    const weekMap = new Map();
    displayEvents.forEach((ev) => {
      const d = new Date(ev.startDateTime);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - dayOfWeek);
      const weekKey = sunday.toISOString().slice(0, 10);
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map());
      const wDayMap = weekMap.get(weekKey);
      if (!wDayMap.has(ev.dateKey)) wDayMap.set(ev.dateKey, []);
      wDayMap.get(ev.dateKey).push(ev);
    });

    weekMap.forEach((wDayMap, weekKey) => {
      const weekSection = document.createElement("div");
      weekSection.className = "week-section";

      const sunday = new Date(weekKey + "T00:00:00");
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const weekLabel = document.createElement("div");
      weekLabel.className = "week-label";
      weekLabel.innerHTML =
        `<span class="week-label-text">${MONTH_NAMES[sunday.getMonth()]} ${sunday.getDate()} – ` +
        `${MONTH_NAMES[saturday.getMonth()]} ${saturday.getDate()}</span>` +
        `<span class="week-collapse-icon">&#9650;</span>`;
      weekLabel.setAttribute("role", "button");
      weekLabel.setAttribute("aria-expanded", "true");
      weekLabel.addEventListener("click", () => {
        const isCollapsed = weekSection.classList.toggle("collapsed");
        weekLabel.setAttribute("aria-expanded", String(!isCollapsed));
      });
      weekSection.appendChild(weekLabel);

      wDayMap.forEach((dayEvents, dateKey) => {
        const [yr, mo, dy] = dateKey.split("-").map(Number);
        const dateObj = new Date(yr, mo - 1, dy);
        const isToday = dateObj.getTime() === today.getTime();
        weekSection.appendChild(
          buildDayGroup(dateKey, dayEvents, isToday, DAY_NAMES),
        );
      });

      mobileView.appendChild(weekSection);
    });
  }
}

/** Builds a single day-group element (badge + event cards). Shared by both view modes. */
function buildDayGroup(dateKey, dayEvents, isToday, DAY_NAMES) {
  const [yr, mo, dy] = dateKey.split("-").map(Number);
  const dateObj = new Date(yr, mo - 1, dy);

  const dayGroup = document.createElement("div");
  dayGroup.className = "day-group";
  dayGroup.dataset.dateKey = dateKey;

  const dayBadge = document.createElement("div");
  dayBadge.className = "day-badge" + (isToday ? " is-today" : "");
  dayBadge.innerHTML = `
    <div class="day-num">${dy}</div>
    <div class="day-name">${DAY_NAMES[dateObj.getDay()]}</div>
  `;

  const dayEventsEl = document.createElement("div");
  dayEventsEl.className = "day-events";

  dayEvents.forEach((ev) => {
    const card = document.createElement("div");
    card.className = `mobile-event-card ${ev.category}`;
    card.dataset.category = ev.category;
    card.dataset.text = (ev.summary + " " + ev.description).toLowerCase();
    card.innerHTML = `
      <div class="mobile-event-accent"></div>
      <div class="mobile-event-body">
        <div class="mobile-event-title">${ev.summary}</div>
        <div class="mobile-event-time">${ev.timeRange}</div>
      </div>
    `;
    card.addEventListener("click", () => {
      if (typeof openEventModal === "function") openEventModal(ev);
    });
    dayEventsEl.appendChild(card);
  });

  dayGroup.appendChild(dayBadge);
  dayGroup.appendChild(dayEventsEl);
  return dayGroup;
}

// Wait for DOM to be fully loaded before calling
document.addEventListener("DOMContentLoaded", function () {
  // populate month dropdown and set default values
  const monthSelect = document.getElementById("month");
  const yearSelect = document.getElementById("year");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  months.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // default to current month/year
  const today = new Date();
  monthSelect.value = today.getMonth();
  yearSelect.value = today.getFullYear();

  window.populateGoogleCal();

  // setup toggle listeners so any change will re-run filtering
  ["babies", "kids", "tweens", "teens", "intergen"].forEach((cat) => {
    const checkbox = document.querySelector(`#${cat}-toggle input`);
    if (checkbox) {
      checkbox.addEventListener("change", window.searchCal);
    }
  });
});

/** Filter events based on search box and demographic toggles.
 *  Runs on both the desktop .event-item elements and the mobile .mobile-event-card elements. */
function searchCal() {
  const query = document.getElementById("myInput").value.toLowerCase();
  const hideDol = {
    babies: document.querySelector("#babies-toggle input").checked,
    kids: document.querySelector("#kids-toggle input").checked,
    tweens: document.querySelector("#tweens-toggle input").checked,
    teens: document.querySelector("#teens-toggle input").checked,
    intergen: document.querySelector("#intergen-toggle input").checked,
  };

  // ── Desktop events ──
  document.querySelectorAll(".event-item").forEach((el) => {
    let visible = true;
    if (query && !el.textContent.toLowerCase().includes(query)) visible = false;
    if (visible) {
      if (hideDol.babies && el.classList.contains("babies")) visible = false;
      if (hideDol.kids && el.classList.contains("kids")) visible = false;
      if (hideDol.tweens && el.classList.contains("tweens")) visible = false;
      if (hideDol.teens && el.classList.contains("teens")) visible = false;
      if (hideDol.intergen && el.classList.contains("intergen"))
        visible = false;
    }
    el.style.display = visible ? "" : "none";
  });

  // ── Mobile event cards ──
  document.querySelectorAll(".mobile-event-card").forEach((card) => {
    let visible = true;
    const cat = card.dataset.category || "";
    const text = card.dataset.text || "";

    if (query && !text.includes(query)) visible = false;
    if (visible) {
      if (hideDol.babies && cat === "babies") visible = false;
      if (hideDol.kids && cat === "kids") visible = false;
      if (hideDol.tweens && cat === "tweens") visible = false;
      if (hideDol.teens && cat === "teens") visible = false;
      if (hideDol.intergen && cat === "intergen") visible = false;
    }
    card.style.display = visible ? "" : "none";
  });

  // ── Hide day groups that have no visible cards ──
  document.querySelectorAll(".day-group").forEach((group) => {
    const anyVisible = [...group.querySelectorAll(".mobile-event-card")].some(
      (c) => c.style.display !== "none",
    );
    group.style.display = anyVisible ? "" : "none";
  });

  // ── Hide week sections that have no visible day groups ──
  document.querySelectorAll(".week-section").forEach((section) => {
    const anyVisible = [...section.querySelectorAll(".day-group")].some(
      (g) => g.style.display !== "none",
    );
    section.style.display = anyVisible ? "" : "none";
  });

  if (typeof initTooltips === "function") initTooltips();
}
