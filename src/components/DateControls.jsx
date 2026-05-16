import { useState } from 'react'

// NASA's range endpoint becomes flaky/500s past ~3 months. Cap at 30 days,
// matching the "Last 30 Days" path that we know is fast and reliable.
const MAX_WINDOW_DAYS = 30

function shiftDate(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
// YYYY-MM-DD strings sort lexicographically, so plain string compare works.
const minStr = (a, b) => (a < b ? a : b)
const maxStr = (a, b) => (a > b ? a : b)

export default function DateControls({ mode, today, firstApod, onFetch, onClose }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const span = MAX_WINDOW_DAYS - 1 // inclusive: start..start+29 = 30 days
  const startMin = end ? maxStr(firstApod, shiftDate(end, -span)) : firstApod
  const startMax = end || today
  const endMin = start || firstApod
  const endMax = start ? minStr(today, shiftDate(start, span)) : today
  const overWindow = !!(start && end && shiftDate(start, span) < end)

  const handleRange = e => {
    e.preventDefault()
    if (!start || !end || overWindow) return
    onFetch('range', { start, end })
  }

  return (
    <div className="date-panel" onClick={e => e.stopPropagation()}>
      <div className="date-panel-header">
        <h3 className="date-panel-title">Browse APOD</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="mode-btns">
        <button
          className={`mode-btn ${mode === 'recent' ? 'active' : ''}`}
          onClick={() => onFetch('recent')}
        >
          Last 30 Days
        </button>
        <button
          className={`mode-btn ${mode === 'on-this-day' ? 'active' : ''}`}
          onClick={() => onFetch('on-this-day')}
        >
          On This Day
        </button>
      </div>

      <div className="date-divider" />

      <form onSubmit={handleRange} className="date-form">
        <p className="date-form-title">Custom Range <span className="date-form-note">(max {MAX_WINDOW_DAYS} days)</span></p>
        <div className="date-inputs">
          <label className="date-label">
            <span>From</span>
            <input
              type="date"
              value={start}
              min={startMin}
              max={startMax}
              onChange={e => setStart(e.target.value)}
            />
          </label>
          <label className="date-label">
            <span>To</span>
            <input
              type="date"
              value={end}
              min={endMin}
              max={endMax}
              onChange={e => setEnd(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-blue" disabled={!start || !end || overWindow}>
          Load Range
        </button>
      </form>

      <p className="date-hint">Archive starts June 16, 1995</p>
    </div>
  )
}
