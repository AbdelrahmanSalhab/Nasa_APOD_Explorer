# NASA APOD Explorer

A full-screen interactive slideshow that consumes NASA's **Astronomy Picture of the Day (APOD)** REST API. Browse 30 years of space imagery with smooth transitions, lazy loading, and flexible date browsing.

**Live demo:** https://nasa-picture-explorer.vercel.app/

## Group Members

| Name | Student ID |
|------|------------|
| Abdelrahman Salhab | 1220192 |
| Osayed Zahdeh | 1220771 |

---

## API Details

**Provider:** NASA (National Aeronautics and Space Administration)  
**Endpoint:** `GET https://api.nasa.gov/planetary/apod`  
**Response format:** JSON  

| Parameter | Description |
|-----------|-------------|
| `api_key` | NASA API key (`DEMO_KEY` works for testing) |
| `start_date` / `end_date` | Fetch a date range (returns array) |
| `date` | Fetch a single specific date |
| `thumbs=true` | Include video thumbnail URLs in response |

---

## Features

### Slideshow
- Full-screen crossfade slideshow with Ken Burns (slow zoom) effect per slide
- Auto-advances every 7 seconds, pauses on mouse hover
- Animated progress bar at the bottom of each slide
- Previous/Next arrow buttons + keyboard navigation (`←` `→`)
- `F` key toggles fullscreen mode (also via button in top-right)

### Date Browsing
- **Last 30 Days** — default view, single API call
- **On This Day** — fetches today's month/day across the last 30 years in parallel
- **Custom Range** — pick any start/end date back to June 16, 1995 (first ever APOD)

### Filmstrip
- Horizontal thumbnail strip at the bottom showing all loaded slides
- Click any thumbnail to jump directly to that slide
- Active thumbnail floats up and glows; strip auto-scrolls to keep it visible
- **Lazy loading** — only the first 11 thumbnails load on render; remaining images load in the background after 800ms so the initial view is fast

### Media Handling
- Images: full-screen background with windowed loading (only ±2 slides from current are fetched upfront)
- MP4 videos: plays inline, muted and looped as the slide background
- YouTube videos: displays the video's thumbnail as a static background image with an "Open Video" button

### UX
- Shimmer skeleton loader while data is fetching
- "Read More / Read Less" to expand the NASA description
- "View HD Image" link opens the original full-resolution photo in a new tab
- Rate limit detection — if the NASA API returns 429, a 60-second countdown appears and auto-retries
- Error screen with "Try Again" button on failed requests
- Fully responsive layout (mobile-friendly)

---

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later

### Setup

```bash
# 1. Navigate to the project folder
cd assignment1

# 2. Install dependencies
npm install

# 3. (Optional) Add your NASA API key
cp .env.example .env
# Edit .env — replace DEMO_KEY with your key from https://api.nasa.gov

# 4. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Get a free NASA API key

1. Visit **https://api.nasa.gov**
2. Fill in the sign-up form and submit
3. Copy the key from the confirmation email
4. Add it to `.env` as `VITE_NASA_API_KEY=your_key_here`

> Without a personal key the app uses `DEMO_KEY`, which is limited to **30 requests/hour and 50/day**.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React](https://react.dev/) + [Vite](https://vite.dev/) | UI framework + build tool |
| Fetch API | HTTP requests to NASA APOD |
| CSS animations | Crossfade, Ken Burns, shimmer — no carousel library |
| Google Fonts | Orbitron (headings), Inter (body) |
| [Vercel](https://vercel.com) | Deployment |
