// GET /api/moon?date=YYYY-MM-DD
// Returns the moon phase for a given date from IPGeolocation's astronomy API.
// Aggressively edge-cached because moon phase for a given calendar date is fixed.
// Written with plain Node req/res so the same handler runs as a Vercel function
// and as Vite dev middleware (see vite.config.js).

const PHASE_EMOJI = {
  NEW_MOON:        '🌑',
  WAXING_CRESCENT: '🌒',
  FIRST_QUARTER:   '🌓',
  WAXING_GIBBOUS:  '🌔',
  FULL_MOON:       '🌕',
  WANING_GIBBOUS:  '🌖',
  LAST_QUARTER:    '🌗',
  WANING_CRESCENT: '🌘',
}

const PHASE_LABEL = {
  NEW_MOON:        'New Moon',
  WAXING_CRESCENT: 'Waxing Crescent',
  FIRST_QUARTER:   'First Quarter',
  WAXING_GIBBOUS:  'Waxing Gibbous',
  FULL_MOON:       'Full Moon',
  WANING_GIBBOUS:  'Waning Gibbous',
  LAST_QUARTER:    'Last Quarter',
  WANING_CRESCENT: 'Waning Crescent',
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x')
  const date = url.searchParams.get('date')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return send(res, 400, { error: 'date query param required as YYYY-MM-DD' })
  }

  const key = process.env.IPGEOLOCATION_API_KEY
  if (!key) {
    return send(res, 500, { error: 'IPGEOLOCATION_API_KEY not configured on server' })
  }

  const target = new URL('https://api.ipgeolocation.io/astronomy')
  target.searchParams.set('apiKey', key)
  // Moon phase is a global property, lat/long do not affect it.
  target.searchParams.set('lat', '0')
  target.searchParams.set('long', '0')
  target.searchParams.set('date', date)

  try {
    const r = await fetch(target)
    if (!r.ok) {
      const detail = await r.text()
      return send(res, r.status, { error: `astronomy api ${r.status}`, detail: detail.slice(0, 200) })
    }
    const data = await r.json()
    const phase = data.moon_phase || 'NEW_MOON'
    const illumination = Number(data.moon_illumination_percentage ?? 0)

    // Moon phase for a calendar date never changes, so let Vercel's edge CDN
    // serve every subsequent user from cache for a year.
    res.setHeader('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=86400')
    return send(res, 200, {
      date,
      phase,
      label: PHASE_LABEL[phase] || phase,
      emoji: PHASE_EMOJI[phase] || '🌑',
      illumination,
    })
  } catch (err) {
    return send(res, 502, { error: 'astronomy fetch failed', detail: String(err) })
  }
}
