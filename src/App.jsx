import { useState, useEffect, useCallback, useRef } from 'react'
import Slideshow from './components/Slideshow'
import Skeleton from './components/Skeleton'
import './index.css'

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'
export const TODAY = new Date().toISOString().split('T')[0]
export const FIRST_APOD = '1995-06-16'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

async function apodFetch(params) {
  const url = new URL('https://api.nasa.gov/planetary/apod')
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('thumbs', 'true')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    const msg = body.msg || body.error?.message || `API error ${r.status}`
    const err = new Error(msg)
    err.status = r.status
    throw err
  }
  return r.json()
}

async function fetchRange(start, end) {
  const data = await apodFetch({ start_date: start, end_date: end })
  return Array.isArray(data) ? [...data].reverse() : [data]
}

const MOON_API_VERSION = 3
async function fetchMoon(date) {
  try {
    const r = await fetch(`/api/moon?date=${date}&v=${MOON_API_VERSION}`)
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

const MOON_CONCURRENCY = 6

async function attachMoonPhases(slides, onUpdate) {
  const out = slides.map(s => ({ ...s }))
  let next = 0
  async function worker() {
    while (next < out.length) {
      const idx = next++
      const moon = await fetchMoon(out[idx].date)
      if (moon) {
        out[idx].moon = moon
        onUpdate?.([...out])
      }
    }
  }
  await Promise.all(Array.from({ length: MOON_CONCURRENCY }, worker))
  return out
}

// Batch at low concurrency and stream partial results so the user sees the first
// slide within ~1s instead of waiting for the whole tail.
const ON_THIS_DAY_CONCURRENCY = 5

async function fetchOnThisDay(onProgress) {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const year = now.getFullYear()
  const dates = Array.from({ length: 30 }, (_, i) => `${year - 1 - i}-${mm}-${dd}`)
    .filter(d => d >= FIRST_APOD)

  const collected = []
  for (let i = 0; i < dates.length; i += ON_THIS_DAY_CONCURRENCY) {
    const batch = dates.slice(i, i + ON_THIS_DAY_CONCURRENCY)
    const results = await Promise.allSettled(batch.map(date => apodFetch({ date })))
    for (const r of results) {
      if (r.status === 'fulfilled') collected.push(r.value)
    }
    if (collected.length && onProgress) {
      onProgress([...collected].sort((a, b) => b.date.localeCompare(a.date)))
    }
  }
  if (!collected.length) throw new Error('No APOD entries found for this date in past years.')
  return [...collected].sort((a, b) => b.date.localeCompare(a.date))
}

export default function App() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryIn, setRetryIn] = useState(null)
  const [mode, setMode] = useState('recent')
  const pendingFnRef = useRef(null)
  const moonGenRef = useRef(0)

  const load = useCallback(async fn => {
    pendingFnRef.current = fn
    setLoading(true)
    setError(null)
    setRetryIn(null)
    let gotFirst = false
    const onProgress = partial => {
      setSlides(partial)
      if (!gotFirst) { gotFirst = true; setLoading(false) }
    }
    try {
      const data = await fn(onProgress)
      setSlides(data)
      const myGen = ++moonGenRef.current
      attachMoonPhases(data, partial => {
        if (moonGenRef.current === myGen) setSlides(partial)
      })
    } catch (err) {
      if (err.status === 429 || err.message?.includes('OVER_RATE_LIMIT')) {
        setRetryIn(60)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // countdown + auto-retry on rate limit
  useEffect(() => {
    if (retryIn === null) return
    if (retryIn === 0) {
      setRetryIn(null)
      load(pendingFnRef.current)
      return
    }
    const t = setTimeout(() => setRetryIn(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [retryIn, load])

  useEffect(() => {
    load(() => fetchRange(daysAgo(29), TODAY))
  }, [load])

  const handleFetch = useCallback((type, params = {}) => {
    setMode(type)
    if (type === 'recent') load(() => fetchRange(daysAgo(29), TODAY))
    else if (type === 'on-this-day') load(fetchOnThisDay)
    else if (type === 'range') load(() => fetchRange(params.start, params.end))
  }, [load])

  if (loading) return <Skeleton />

  if (retryIn !== null) {
    return (
      <div className="loader">
        <div className="loader-ring" />
        <span className="loader-text">Rate limit reached. Retrying in {retryIn}s</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <p className="error-title">Could not load APOD</p>
          <p className="error-msg">{error}</p>
          <button className="btn btn-ghost" onClick={() => load(() => fetchRange(daysAgo(29), TODAY))}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <Slideshow
      slides={slides}
      mode={mode}
      onFetch={handleFetch}
      today={TODAY}
      firstApod={FIRST_APOD}
    />
  )
}
