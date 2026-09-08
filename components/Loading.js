export default function Loading({ label = 'Chargement…' }) {
  return (
    <div className="center-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <div className="muted" style={{ fontSize: 13 }}>{label}</div>
      </div>
    </div>
  );
}
