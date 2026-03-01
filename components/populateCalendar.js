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
    //document.getElementById("rR").textContent = JSON.stringify(res);

    // Call AssignCalEvents after fetching data
    AssignCalEvents(res);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    document.getElementById("rR").textContent =
      "Sorry, Sarah. You messed up! Error loading calendar: " + error.message;
  }
}

function AssignCalEvents(res) {
  // Logic to assign calendar events to the calendar view goes here
  // This function would parse the 'res' object and update the calendar UI accordingly

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
      return "teens"; // event is for teens
    }
    if (
      s.includes("let's play tuesdays") ||
      s.includes("puzzles, chess, and magic") ||
      s.includes("for tweens") ||
      s.includes("laser tag")
    ) {
      return "tweens"; // event is for tweens
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
      return "babies"; // event is for babies and littles
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
      return "kids"; // event is for kids
    }
    if (
      s.includes("snowflake festival") ||
      s.includes("kickoff") ||
      s.includes("endgames") ||
      s.includes("intergenerational") ||
      s.includes("all ages")
    ) {
      return "intergen"; // event is for all ages
    }
    return "";
  }

  // Clear previous events from calendar cells
  document.querySelectorAll(".event-item").forEach((el) => el.remove());

  // Handle both array and object responses
  const events = Array.isArray(thisMonthsEvents)
    ? thisMonthsEvents
    : thisMonthsEvents?.items || [];

  // Loop through each event
  events.forEach((event) => {
    // Extract date from start dateTime (e.g., 2026-03-02T10:30:00-05:00)
    const startDateTime = new Date(event.start.dateTime);
    const year = startDateTime.getFullYear();
    const month = String(startDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(startDateTime.getDate()).padStart(2, "0");
    const dateId = `date-${year}-${month}-${day}`;

    // Extract and format times
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

    // Find the matching calendar cell
    const cell = document.getElementById(dateId);
    if (cell) {
      // Create event container
      const eventEl = document.createElement("div");
      eventEl.className = "event-item";
      // apply category-specific id if one is determined
      const cat = getCategoryClass(event.summary);
      if (cat) {
        eventEl.classList.add(cat);
      }
      eventEl.innerHTML = `
            <div class="event-item event-summary"><a href="${event.htmlLink}" target="_blank"><strong>${event.summary}</strong></a></div>
            <div class="event-item event-time">${startTime} - ${endTime}</div>
            <div class="event-item event-description">${event.description}</div>
          `;
      //  <div class="event-description">${event.description}</div>
      cell.appendChild(eventEl);
    }
  });
}

// after inserting all events, apply filters in case toggles/search are active
if (typeof searchCal === "function") {
  searchCal();
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

  populateGoogleCal();

  // setup toggle listeners so any change will re-run filtering
  ["babies", "kids", "tweens", "teens", "intergen"].forEach((cat) => {
    const checkbox = document.querySelector(`#${cat}-toggle input`);
    if (checkbox) {
      checkbox.addEventListener("change", searchCal);
    }
  });
});

/** Filter events based on search box and demographic toggles. Now changed
 * to work with the new category classes and ids, and to be more efficient by combining all filters into one loop. */
function searchCal() {
  const query = document.getElementById("myInput").value.toLowerCase();
  const hideDol = {
    babies: document.querySelector("#babies-toggle input").checked,
    kids: document.querySelector("#kids-toggle input").checked,
    tweens: document.querySelector("#tweens-toggle input").checked,
    teens: document.querySelector("#teens-toggle input").checked,
    intergen: document.querySelector("#intergen-toggle input").checked,
  };

  document.querySelectorAll(".event-item").forEach((el) => {
    let visible = true;
    // text search
    if (query && !el.textContent.toLowerCase().includes(query)) {
      visible = false;
    }
    // category toggles (hide when checked)
    if (visible) {
      if (hideDol.babies && el.classList.contains("babies")) visible = false;
      if (hideDol.kids && el.classList === "kids") visible = false;
      if (hideDol.tweens && el.classList.contains("tweens")) visible = false;
      if (hideDol.teens && el.classList.contains("teens")) visible = false;
      if (hideDol.intergen && el.classList.contains("intergen"))
        visible = false;
    }
    el.style.display = visible ? "" : "none";
  });
}
