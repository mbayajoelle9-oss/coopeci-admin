export default function StatCard({ label, value, foot, navy }) {
  return (
    <div className={`stat ${navy ? 'navy' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value tnum">{value}</div>
      {foot ? <div className="stat-foot">{foot}</div> : null}
    </div>
  );
}
