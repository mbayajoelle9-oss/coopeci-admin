import { FileQuestion, Settings, Scale, Users, Landmark, FileBarChart, Wallet } from 'lucide-react';

const ICON_MAP = {
  '⚙': Settings,
  '⚖': Scale,
  '◉': Users,
  '₵': Landmark,
  '▤': FileBarChart,
  '▦': Wallet,
};

export default function EmptyState({ icon, title, message, action }) {
  const Icon = ICON_MAP[icon] || FileQuestion;
  return (
    <div className="empty">
      <div className="empty-ico"><Icon size={26} strokeWidth={2} /></div>
      <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 16 }}>{title}</div>
      {message ? <div style={{ marginTop: 6, maxWidth: 340, marginInline: 'auto' }}>{message}</div> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
