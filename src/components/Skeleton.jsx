export default function Skeleton() {
  return (
    <div className="skeleton">
      <div className="sk-bg shimmer" />
      <div className="sk-content">
        <div className="sk-line sk-short shimmer" />
        <div className="sk-line sk-long shimmer" />
        <div className="sk-line sk-medium shimmer" />
        <div className="sk-line sk-medium shimmer" />
        <div className="sk-actions">
          <div className="sk-btn shimmer" />
          <div className="sk-btn shimmer" />
        </div>
      </div>
      <div className="sk-filmstrip">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="sk-thumb shimmer" />
        ))}
      </div>
    </div>
  )
}
