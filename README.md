# NASA APOD Explorer

A full-screen interactive slideshow that consumes NASA's **Astronomy Picture of the Day (APOD)** REST API. Browse 30 years of space imagery with smooth transitions, lazy loading, and flexible date browsing.

**Live demo:** https://nasa-picture-explorer.vercel.app/

## Group Members

| Name | Student ID |
|------|------------|
| Abdelrahman Salhab | 1220192 |
| Osayed Zahdeh | 1220771 |

---

## About the API

### Provider
**NASA** (National Aeronautics and Space Administration) publicly available and free to use with a registered API key.

### Base URL
```
https://api.nasa.gov/planetary/apod
```

### HTTP Method
All requests use **GET**. The API is read-only and stateless, each request is fully self-contained via URL parameters.

### Authentication
The API uses a simple **API key** passed as a query parameter:
```
?api_key=YOUR_KEY
```
A free personal key from [api.nasa.gov](https://api.nasa.gov) allows 1,000 requests/hour.

### Response Format
The API returns **JSON**. A range request returns a JSON array; a single-date request returns a JSON object.

---

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `api_key` | string | **Required.** Your NASA API key or `DEMO_KEY` |
| `date` | string | Return the APOD for a specific date (`YYYY-MM-DD`). Defaults to today. |
| `start_date` | string | Start of a date range (`YYYY-MM-DD`). Returns an array. |
| `end_date` | string | End of a date range (`YYYY-MM-DD`). Used together with `start_date`. |
| `thumbs` | boolean | If `true`, include a `thumbnail_url` field for video entries. |

---

## Sample API Responses

### Single date (`?date=2026-05-06`)
```json
{
  "date": "2026-05-06",
  "title": "The Retrograde Dance of Saturn and Neptune",
  "explanation": "What does it mean for Saturn and Neptune to be in retrograde?...",
  "url": "https://apod.nasa.gov/apod/image/2605/saturn_neptune_retrograde_1024.jpg",
  "hdurl": "https://apod.nasa.gov/apod/image/2605/saturn_neptune_retrograde.jpg",
  "media_type": "image",
  "service_version": "v1",
  "copyright": "Tunç Tezel (TWAN)"
}
```

### Video entry (`media_type: "video"`)
```json
{
  "date": "2026-05-04",
  "title": "Superplumes Inside Earth",
  "explanation": "Why are there huge, unusual masses inside the Earth?...",
  "url": "https://apod.nasa.gov/apod/image/2605/SuperPlumeEarth_Cottaar.mp4",
  "media_type": "video",
  "thumbnail_url": "",
  "service_version": "v1"
}
```

### Response fields used by this app

| Field | Used for |
|-------|----------|
| `title` | Slide heading |
| `date` | Displayed date + filmstrip year label |
| `explanation` | Expandable description text |
| `url` | Main slide background + filmstrip thumbnail |
| `hdurl` | "View HD" link target (images only) |
| `media_type` | Determines whether to render image, MP4 video, or YouTube thumbnail |
| `copyright` | Attribution shown on slide |
| `thumbnail_url` | Video thumbnail (often empty; app falls back to canvas frame capture) |

---

## How the App Fetches Data

All API calls go through a single `apodFetch()` helper in `src/App.jsx` that builds the URL, attaches the API key, and throws a typed error on non-OK responses:

```js
async function apodFetch(params) {
  const url = new URL('https://api.nasa.gov/planetary/apod')
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('thumbs', 'true')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw Object.assign(new Error(body.msg || `API error ${r.status}`), { status: r.status })
  }
  return r.json()
}
```

### Mode 1 — Last 30 Days (default)
A **single request** with `start_date` and `end_date`:
```
GET /planetary/apod?api_key=...&thumbs=true&start_date=2026-04-06&end_date=2026-05-06
```
Returns a JSON array of 30 objects, reversed so the newest is first.

### Mode 2 — On This Day
**Up to 30 parallel requests**, one per year, all fired simultaneously with `Promise.allSettled`:
```
GET /planetary/apod?api_key=...&thumbs=true&date=2025-05-06
GET /planetary/apod?api_key=...&thumbs=true&date=2024-05-06
GET /planetary/apod?api_key=...&thumbs=true&date=2023-05-06
...
```
Failures (e.g. dates before June 16 1995, the first APOD) are silently filtered out. Results are sorted newest-first.

### Mode 3 — Custom Range
Same as Mode 1 but with user-chosen dates:
```
GET /planetary/apod?api_key=...&thumbs=true&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

### Error Handling
| HTTP Status | Behaviour |
|-------------|-----------|
| `429 Too Many Requests` | Shows a 60-second countdown, then auto-retries the same request |
| Any other error | Shows an error card with a "Try Again" button |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React](https://react.dev/) + [Vite](https://vite.dev/) | UI framework + build tool |
| Fetch API | HTTP requests to NASA APOD |
| CSS animations | Crossfade, Ken Burns, shimmer — no external carousel library |
| Google Fonts | Orbitron (headings), Inter (body) |
| [Vercel](https://vercel.com) | Deployment |
