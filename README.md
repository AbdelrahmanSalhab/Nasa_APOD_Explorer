# NASA APOD Explorer

A slideshow that shows NASA's Astronomy Picture of the Day next to the moon phase for that date. You can view the last 30 days, the same day in past years, or a custom range.

**Live demo:** https://nasa-picture-explorer.vercel.app/

## Group Members

| Name | Student ID |
|------|------------|
| Abdelrahman Salhab | 1220192 |
| Osayed Zahdeh | 1220771 |

## How we call NASA's APOD

We use the browser's `fetch` to hit NASA's APOD endpoint. This is the part that actually sends the request (from `src/App.jsx`):

```js
const url = new URL('https://api.nasa.gov/planetary/apod')
url.searchParams.set('api_key', API_KEY)
url.searchParams.set('thumbs', 'true')
for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
const r = await fetch(url)
```

So every call is just a `GET` to `https://api.nasa.gov/planetary/apod` with the API key and some parameters tacked onto the URL.

## How NASA's APOD works

NASA's APOD API is free. You sign up at api.nasa.gov, get a key, and pass it as `?api_key=...` on every request. There's no login, no headers, no body. Everything goes in the URL. You get 1000 requests per hour per key.

The parameters we use:

- `date=YYYY-MM-DD`: get the picture for one specific day. Returns one JSON object.
- `start_date` + `end_date`: get a range of days. Returns a JSON array.
- `thumbs=true`: when the picture is actually a video, also give us a thumbnail.

The response is JSON. Each item has a `title`, `date`, `explanation`, `url` (the picture or video link), `hdurl` (high-res version), and `media_type` so we know if it's an image or a video.

The three modes in the app map to these:

1. **Last 30 days**: one request with `start_date` and `end_date`.
2. **On this day**: one request per year, fired in small batches so the first slide shows up fast.
3. **Custom range**: same as mode 1 but with dates the user picks (capped at 30 days because bigger windows make NASA's server return 500 errors).

If we hit the rate limit (HTTP 429) the app shows a 60-second countdown and retries automatically.

## How we call the moon API

The moon API goes through a Vercel serverless function (`api/moon.js`) instead of straight from the browser, so the IPGeolocation key never ships to the client. The browser just hits our own URL (from `src/App.jsx`):

```js
const r = await fetch(`/api/moon?date=${date}&v=${MOON_API_VERSION}`)
```

The function calls IPGeolocation server-side and returns `{ date, phase, label, illumination }`. It also sets `Cache-Control: public, s-maxage=31536000`, so Vercel's edge CDN caches each date for a year. Moon phase for a calendar date never changes, so the first user pays the round-trip and every later user reads from the edge for free. The `v=` query param is a manual cache buster we bump when the response shape changes.

## How the moon API works

IPGeolocation's `/astronomy` endpoint is free up to 1000 requests/day. You sign up at ipgeolocation.io, get a key, and pass `apiKey`, `lat`, `long`, and `date` on every request. We hardcode `lat=0&long=0` because moon phase is a global property of the Sun–Earth–Moon geometry, not observer-dependent.

The response includes `moon_phase` (one of 8 strings: `NEW_MOON`, `WAXING_CRESCENT`, `FIRST_QUARTER`, `WAXING_GIBBOUS`, `FULL_MOON`, `WANING_GIBBOUS`, `LAST_QUARTER`, `WANING_CRESCENT`) and a raw `moon_illumination_percentage`. We use only the enum: each phase maps to a fixed illumination (0 / 25 / 50 / 75 / 100). The raw percentage came back non-monotonic across consecutive waxing days, which suggests an API data quality issue (likely inconsistent sampling times within each calendar day), so we ignore it.

Each slide renders a small SVG moon disk (`src/components/MoonDisk.jsx`) drawn at the bucketed illumination, mirrored horizontally for the four waning phases.
