import { useState } from 'react'

export default function DateControls({ mode, today, firstApod, onFetch, onClose }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const handleRange = e => {
    e.preventDefault()
    if (start && end) onFetch('range', { start, end })
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
        <p className="date-form-title">Custom Range</p>
        <div className="date-inputs">
          <label className="date-label">
            <span>From</span>
            <input
              type="date"
              value={start}
              min={firstApod}
              max={end || today}
              onChange={e => setStart(e.target.value)}
            />
          </label>
          <label className="date-label">
            <span>To</span>
            <input
              type="date"
              value={end}
              min={start || firstApod}
              max={today}
              onChange={e => setEnd(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="btn btn-blue" disabled={!start || !end}>
          Load Range
        </button>
      </form>

      <p className="date-hint">Archive starts June 16, 1995</p>
    </div>
  )
}
