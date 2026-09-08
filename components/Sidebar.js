'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { can } from '@/lib/format';

const NAV = [
  { group: 'Pilotage', items: [
    { href: '/dashboard', label: 'Tableau de bord', ico: '▚' },
    { href: '/reports', label: 'Rapports', ico: '▤', gate: (r) => can.par(r) },
  ]},
  { group: 'Opérations', items: [
    { href: '/members', label: 'Membres', ico: '◉' },
    { href: '/credits', label: 'Crédits', ico: '₵' },
    { href: '/committee', label: 'Comité', ico: '⚖', gate: (r) => can.committee(r) },
    { href: '/cashier', label: 'Caisse', ico: '▦', gate: (r) => can.cashier(r) },
  ]},
  { group: 'Administration', items: [
    { href: '/users', label: 'Utilisateurs', ico: '⚙', gate: (r) => can.users(r) },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">C</div>
        <div>
          <div className="sidebar-brand-name">COOPECI-DC</div>
          <div className="sidebar-brand-sub">Back-office</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {NAV.map((section) => {
          const items = section.items.filter((it) => !it.gate || it.gate(role));
          if (!items.length) return null;
          return (
            <div key={section.group}>
              <div className="nav-group-label">{section.group}</div>
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + '/');
                return (
                  <div key={it.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => router.push(it.href)}>
                    <span className="nav-ico">{it.ico}</span>
                    <span>{it.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">Coopérative d'Épargne, de Crédit<br />et d'Investissement Debout Congolais</div>
    </aside>
  );
}
