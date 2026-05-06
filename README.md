# NASA APOD Explorer

A React web application that displays NASA's **Astronomy Picture of the Day (APOD)** as a full-screen interactive slideshow. Each slide features a stunning space image with its title, date, description, and a link to the full HD version.

## Group Members

| Name | Student ID |
|------|------------|
| Abdelrahman Salhab | 1220192 |
| Osayed Zahdeh | 1220771 |

## Project Description

This project consumes the **NASA APOD REST API** (`https://api.nasa.gov/planetary/apod`) to fetch the last 10 days of astronomy images and display them in a cinematic full-screen slideshow.

**API used:** NASA Astronomy Picture of the Day (APOD)  
**Provider:** NASA (National Aeronautics and Space Administration)  
**Endpoint:** `GET https://api.nasa.gov/planetary/apod`  
**Response format:** JSON  
**Key query parameters:**
- `api_key` — your NASA API key (use `DEMO_KEY` for testing)
- `start_date` / `end_date` — fetch a date range
- `thumbs=true` — include video thumbnail URLs

## Features

- Full-screen crossfade slideshow with Ken Burns zoom effect
- Auto-advance every 7 seconds (pauses on hover)
- Keyboard navigation (← → arrow keys)
- Dot indicators + previous/next arrow buttons
- Animated progress bar
- "Read More" to expand each image's description
- "View HD Image" link to the full-resolution photo
- Handles both image and video APODs

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

### Setup

```bash
# 1. Navigate to the project folder
cd assignment1

# 2. Install dependencies
npm install

# 3. (Optional) Set your NASA API key
cp .env.example .env
# Edit .env and replace DEMO_KEY with your key from https://api.nasa.gov

# 4. Start the development server
npm run dev
```

Open your browser at `http://localhost:5173`

### Get a free NASA API key

1. Visit https://api.nasa.gov
2. Fill in the sign-up form and submit
3. Copy the API key from the confirmation email
4. Paste it into `.env` as `VITE_NASA_API_KEY=your_key_here`

> Without a personal key, the app uses `DEMO_KEY` (limited to 30 requests/hour).

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- Fetch API for HTTP requests
- CSS animations (no external carousel library)
- Google Fonts: Orbitron, Inter
