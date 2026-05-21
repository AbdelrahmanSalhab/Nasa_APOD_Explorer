// Renders the moon at its exact illumination fraction as an SVG disk.
// The lit region is bounded by two arcs: the limb (outer half-circle on the
// lit side) and the terminator (an ellipse with horizontal radius |2k-1|*50).
// Sweep flag flips between crescent (k<0.5) and gibbous (k>0.5).
// For waning phases, we horizontally mirror so the lit side is on the left.

export default function MoonDisk({ phase, illumination, size = 16 }) {
  const raw = Number(illumination)
  const k = Number.isFinite(raw) ? Math.min(Math.max(raw / 100, 0), 1) : 0
  const waning = phase?.startsWith('WANING') || phase === 'LAST_QUARTER'
  const rx = Math.abs(2 * k - 1) * 50
  const sweep = k >= 0.5 ? 1 : 0

  return (
    <svg
      viewBox="-52 -52 104 104"
      width={size}
      height={size}
      className="moon-disk"
      aria-hidden="true"
    >
      <circle r="50" className="moon-disk-dark" />
      <g transform={waning ? 'scale(-1, 1)' : undefined}>
        <path
          d={`M 0 -50 A 50 50 0 0 1 0 50 A ${rx} 50 0 0 ${sweep} 0 -50 Z`}
          className="moon-disk-lit"
        />
      </g>
      <circle r="50" className="moon-disk-rim" />
    </svg>
  )
}
