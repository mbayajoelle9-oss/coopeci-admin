export default function Gauge({ value = 0, max = 100, label, color = 'var(--azure)', size = 160 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = 62, stroke = 14;
  const circumference = Math.PI * r; // demi-cercle
  const dash = circumference * pct;
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 160 92" width={size} height={size * 0.575}>
        <path d="M 18 82 A 62 62 0 0 1 142 82" fill="none" stroke="var(--border)" strokeWidth={stroke} strokeLinecap="round" />
        <path d="M 18 82 A 62 62 0 0 1 142 82" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <div className="gauge-value tnum" style={{ color, marginTop: -14 }}>{value}%</div>
      {label ? <div className="gauge-label">{label}</div> : null}
    </div>
  );
}
