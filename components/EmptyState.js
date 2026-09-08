export default function EmptyState({ icon = '📄', title, message, action }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <div style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--serif)', fontSize: 16 }}>{title}</div>
      {message ? <div style={{ marginTop: 6, maxWidth: 340, marginInline: 'auto' }}>{message}</div> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
