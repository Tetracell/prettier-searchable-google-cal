# PrettierCal — Derby Neck Library Calendar

A custom, searchable calendar display for the [Derby Neck Library](https://www.derbynecklibrary.org), built by Sarah Zareski. Fetches events from a public Google Calendar and renders them in a clean, filterable interface — with both a desktop table view and a mobile-friendly list view.

---

## Features

- **Live Google Calendar sync** — pulls events from a public Google Calendar via a Vercel serverless API route
- **Demographic filtering** — toggle visibility by age group: Babies & Littles, Kids, Tweens, Teens, and Intergenerational
- **Keyword search** — filters events in real time across both desktop and mobile views
- **Desktop calendar view** — traditional month grid with color-coded event cards and Tippy.js tooltips on click
- **Mobile list view** — week-grouped event list with a card-based layout; supports an "Upcoming (Next 3 Days)" mode and a "Full Month" mode
- **Event detail modal** — tap any mobile event card to open a bottom-sheet modal with full details and a link to Google Calendar
- **Month navigation** — previous/next buttons, a "Today" shortcut, and a jump-to month/year selector
- **Responsive layout** — desktop and mobile layouts handled independently via CSS, with a sticky sidebar on desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| Calendar API | Google Calendar API v3 (`googleapis` npm package) |
| Tooltips | [Tippy.js](https://atomiks.github.io/tippyjs/) v6 |
| Deployment | [Vercel](https://vercel.com) |

---

## Project Structure
```
├── index.html                  # Main page — layout, modal, toolbar, sidebar
├── calstyle.css                # All styles: layout, event cards, mobile, modal
├── components/
│   ├── calendarview.js         # Builds the desktop month grid (showCalendar, next, previous, jump)
│   └── populateCalendar.js     # Fetches events, renders desktop cells + mobile list, search/filter logic
├── api/
│   └── callinggoogle.js        # Vercel serverless function — queries the Google Calendar API
├── middleware.js               # Vercel Edge Middleware — sets security response headers
├── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Vercel](https://vercel.com) account
- A Google Calendar API key (works with **public** calendars only — no OAuth required)

### Local Development

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd <repo-folder>
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up your environment variable**

   Create a `.env.local` file in the project root:
```
   GOOGLE_CAL_API_KEY=your_api_key_here
```
   > ⚠️ Never commit this file — it is already covered by `.gitignore`.

4. **Run locally with the Vercel CLI**
```bash
   npx vercel dev
```
   This spins up the serverless `/api` route alongside the static frontend.

---

## Configuration

### Changing the Calendar

The Google Calendar ID is hardcoded in `api/callinggoogle.js`. Replace the `calendarId` value with your own public Google Calendar ID:
```js
calendarId: "your-calendar-id@group.calendar.google.com",
```

### Event Categorization

Events are assigned a demographic category based on keywords found in their title. The mapping logic lives in `getCategoryClass()` inside `components/populateCalendar.js`. Categories and their CSS classes are:

| Category | CSS Class | Accent Color |
|---|---|---|
| Babies & Littles | `babies` | Peach / Orange |
| Kids | `kids` | Yellow |
| Tweens | `tweens` | Red / Pink |
| Teens | `teens` | Purple |
| Intergenerational / All Ages | `intergen` | Green |

To add new event types, extend the `if/else` chain in `getCategoryClass()` and add matching CSS custom properties in `calstyle.css`.

---

## Deployment

This project is designed to deploy on Vercel with minimal configuration.

1. Push the repository to GitHub (or another Git provider).
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add `GOOGLE_CAL_API_KEY` as an environment variable in the Vercel project settings.
4. Deploy — Vercel automatically detects the `/api` directory and serves it as serverless functions.

The `middleware.js` file applies the following security headers to all responses:

- `Strict-Transport-Security`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: frame-ancestors 'self' https://www.derbynecklibrary.org`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`

---

## Known Limitations

- **Public calendars only** — API key authentication only works with calendars set to public. Private calendars require OAuth 2.0 (an exploratory OAuth implementation can be found in `test.js`).
- **All-day events are not supported** — the parser expects `event.start.dateTime`; all-day events use `event.start.date` and will be silently skipped.
- **Category matching is keyword-based** — events that don't match any keyword default to the `intergen` (All Ages) category.

---

## Credits

- **Sarah Zareski** — original design, architecture, and implementation
- **Tom LaTulipe** — additional contributions
- Base CSS adapted from [`new.css`](https://newcss.net/) by @exampledev (MIT License)
- HR styling adapted from a [Stack Overflow answer](https://stackoverflow.com/a/4151770) by Gregg B (CC BY-SA 4.0)