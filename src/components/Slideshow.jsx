import { useState, useEffect, useCallback, useRef } from 'react'
import DateControls from './DateControls'
import MoonDisk from './MoonDisk'

const INTERVAL = 7000

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function isYouTube(url) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function youTubeThumb(url) {
  const m = url.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/)
  // mqdefault has no letterbox bars and no baked-in play button
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}

// Only handles MP4 videos. YouTube is treated as a static thumbnail (no embed)
function VideoBackground({ slide, active }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (active) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [active])

  return (
    <div className={`slide-bg video-slide ${active ? 'active' : ''}`}>
      <video ref={videoRef} src={slide.url} muted loop playsInline preload="none" />
    </div>
  )
}

function VideoThumb({ url }) {
  const [src, setSrc] = useState(() => isYouTube(url) ? youTubeThumb(url) : null)

  useEffect(() => {
    if (src || !url.includes('.mp4')) return
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'metadata'
    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 160; canvas.height = 90
        canvas.getContext('2d').drawImage(video, 0, 0, 160, 90)
        setSrc(canvas.toDataURL('image/jpeg', 0.75))
      } catch { /* CORS blocked, leave src null and show placeholder */ }
      video.src = ''
    }
    video.addEventListener('loadeddata', () => { video.currentTime = 2 })
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', () => { video.src = '' })
    video.src = url
    return () => { video.src = '' }
  }, [url, src])

  if (src) return <img src={src} alt="" loading="lazy" />

  return (
    <div className="film-video-placeholder">
      <div className="film-play-circle">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}

function Filmstrip({ slides, current, onSelect }) {
  const stripRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [current])

  return (
    <div className="filmstrip" ref={stripRef}>
      {slides.map((s, i) => (
        <button
          key={s.date}
          ref={i === current ? activeRef : null}
          className={`film-thumb ${i === current ? 'active' : ''}`}
          onClick={() => onSelect(i)}
          aria-label={s.title}
        >
          {s.media_type === 'video'
            ? <VideoThumb url={s.url} />
            : <div className="film-lazy-img">
                <img src={s.url} alt="" loading="lazy" decoding="async" />
              </div>
          }
          <span className="film-label">{s.date.slice(0, 4)}</span>
        </button>
      ))}
    </div>
  )
}

export default function Slideshow({ slides, mode, onFetch, today, firstApod }) {
  const [current, setCurrent] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [paused, setPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showDatePanel, setShowDatePanel] = useState(false)
  const containerRef = useRef(null)
  const firstDateRef = useRef(null)

  const goTo = useCallback(index => {
    setCurrent(index)
    setExpanded(false)
  }, [])

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo])
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }, [])

  // reset only when the slide set actually changes (not when progressive batches
  // append more years to the same on-this-day fetch)
  useEffect(() => {
    const firstDate = slides[0]?.date
    if (firstDate !== firstDateRef.current) {
      firstDateRef.current = firstDate
      setCurrent(0)
      setExpanded(false)
    }
  }, [slides])

  // auto-advance
  useEffect(() => {
    if (paused) return
    const t = setInterval(next, INTERVAL)
    return () => clearInterval(t)
  }, [next, paused])

  // keyboard navigation
  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'Escape' && showDatePanel) setShowDatePanel(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [next, prev, toggleFullscreen, showDatePanel])

  // fullscreen state sync
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  // preload adjacent images
  useEffect(() => {
    [
      slides[(current + 1) % slides.length],
      slides[(current - 1 + slides.length) % slides.length],
    ].forEach(s => {
      if (s?.media_type === 'image') { new Image().src = s.url }
    })
  }, [current, slides])

  const slide = slides[current]

  return (
    <div
      className="slideshow"
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backgrounds: only load images within ±2 of current to avoid fetching everything upfront */}
      {slides.map((s, i) => {
        const n = slides.length
        const dist = Math.min(Math.abs(i - current), n - Math.abs(i - current))
        const inWindow = dist <= 2
        // MP4 video: use video element (handles play/pause)
        if (s.media_type === 'video' && !isYouTube(s.url))
          return <VideoBackground key={s.date} slide={s} active={i === current} />
        // Image or YouTube: windowed background-image (YouTube uses its thumbnail)
        const bgUrl = isYouTube(s.url) ? youTubeThumb(s.url) : s.url
        return (
          <div
            key={s.date}
            className={`slide-bg ${i === current ? 'active' : ''}`}
            style={inWindow && bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}
          />
        )
      })}

      <div className="overlay" />

      {/* Top-left: counter, moon chip, mode badge inline */}
      <div className="top-left">
        <span className="slide-counter">
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
        {slide.moon && (
          <span className="moon-chip" title={slide.moon.label}>
            <MoonDisk
              phase={slide.moon.phase}
              illumination={slide.moon.illumination}
              size={16}
            />
            <span className="moon-chip-label">{slide.moon.label}</span>
          </span>
        )}
        {mode === 'on-this-day' && <span className="mode-badge">On This Day</span>}
      </div>

      {/* Top-right: icon buttons + NASA badge */}
      <div className="top-right">
        <button
          className={`icon-btn ${showDatePanel ? 'icon-btn-active' : ''}`}
          onClick={() => setShowDatePanel(o => !o)}
          title="Browse by date"
          aria-label="Browse dates"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          className="icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v3a1 1 0 01-2 0V5a3 3 0 013-3h3a1 1 0 010 2H5zm10 0h-3a1 1 0 010-2h3a3 3 0 013 3v3a1 1 0 01-2 0V5a1 1 0 00-1-1zM5 16a1 1 0 001-1v-3a1 1 0 012 0v3a3 3 0 01-3 3H2a1 1 0 010-2h3zm10 0a3 3 0 003-3v-3a1 1 0 012 0v3a3 3 0 01-3 3h-3a1 1 0 010-2h3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l2.293 2.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 4H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm12-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <div className="nasa-badge">
          <div className="nasa-dot" />
          <span>NASA APOD</span>
        </div>
      </div>

      {/* Date panel */}
      {showDatePanel && (
        <DateControls
          mode={mode}
          today={today}
          firstApod={firstApod}
          onFetch={(type, params) => { onFetch(type, params); setShowDatePanel(false) }}
          onClose={() => setShowDatePanel(false)}
        />
      )}

      {/* Slide content */}
      <div className="slide-content" key={slide.date}>
        <div className="slide-meta">
          <span className="slide-date">{formatDate(slide.date)}</span>
          {slide.copyright && (
            <span className="slide-copyright">© {slide.copyright.trim()}</span>
          )}
        </div>
        <h1 className="slide-title">{slide.title}</h1>
        <p className={`slide-explanation ${expanded ? 'expanded' : ''}`}>
          {slide.explanation}
        </p>
        <div className="slide-actions">
          <button className="btn btn-ghost" onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲ Read Less' : '▼ Read More'}
          </button>
          {slide.media_type === 'video' ? (
            <a href={slide.url} target="_blank" rel="noreferrer" className="btn btn-blue">
              ▶ Open Video
            </a>
          ) : (
            <a href={slide.hdurl || slide.url} target="_blank" rel="noreferrer" className="btn btn-blue">
              ↗ View HD
            </a>
          )}
        </div>
      </div>

      {/* Nav arrows */}
      <button className="nav-btn prev" onClick={prev} aria-label="Previous">‹</button>
      <button className="nav-btn next" onClick={next} aria-label="Next">›</button>

      {/* Filmstrip */}
      <Filmstrip slides={slides} current={current} onSelect={goTo} />

      {/* Progress bar */}
      {!paused && <div key={`pb-${current}`} className="progress-bar" />}
    </div>
  )
}
