function KpiCard({ label, value, trend }) {
  return (
    <article className="kpi-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{trend}</span>
    </article>
  )
}

export default KpiCard
